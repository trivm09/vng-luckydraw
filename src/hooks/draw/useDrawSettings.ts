import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DrawSettings {
  id: string;
  current_prize: string;
  background_url: string;
  is_spinning: boolean;
  winning_code: string;
  winning_name: string;
  show_result: boolean;
}

export function useDrawSettings() {
  const [settings, setSettings] = useState<DrawSettings | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: settingsData } = await supabase
        .from("draw_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }
    };

    fetchSettings();
  }, [supabase]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("draw_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draw_settings",
        },
        (payload) => {
          const newSettings = payload.new as DrawSettings;
          setSettings(newSettings);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  return settings;
}
