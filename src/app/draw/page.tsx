"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Maximize, Minimize, ImagePlus, X, Gift } from "lucide-react";
import { toast } from "sonner";

interface DrawSettings {
  id: string;
  current_prize: string;
  background_url: string;
  is_spinning: boolean;
  winning_code: string;
  winning_name: string;
  show_result: boolean;
}

const BACKGROUND_STORAGE_KEY = "draw_background_image";
const POPUP_BACKGROUND_STORAGE_KEY = "draw_popup_background_image";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const CODE_LENGTH = 6;
const SPIN_CHARS = "0123456789";
const SPIN_INTERVAL_MS = 50;
const DEFAULT_CODE = "??????";

// Generate random code for spinning effect
const generateRandomCode = () => {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += SPIN_CHARS.charAt(Math.floor(Math.random() * SPIN_CHARS.length));
  }
  return result;
};

// Helper to update display code based on settings
const getDisplayCode = (settings: DrawSettings | null): string | null => {
  if (settings?.show_result && settings.winning_code) {
    return settings.winning_code;
  }
  return null;
};

export default function DrawPage() {
  const [settings, setSettings] = useState<DrawSettings | null>(null);
  const [displayCode, setDisplayCode] = useState(DEFAULT_CODE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localBackground, setLocalBackground] = useState<string | null>(null);
  const [popupBackground, setPopupBackground] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupFileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Load backgrounds from localStorage on mount
  useEffect(() => {
    const savedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (savedBackground) {
      setLocalBackground(savedBackground);
    }
    const savedPopupBackground = localStorage.getItem(
      POPUP_BACKGROUND_STORAGE_KEY
    );
    if (savedPopupBackground) {
      setPopupBackground(savedPopupBackground);
    }
  }, []);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: settingsData } = await supabase
        .from("draw_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings(settingsData);
        const code = getDisplayCode(settingsData);
        if (code) setDisplayCode(code);
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

          const code = getDisplayCode(newSettings);
          if (code) setDisplayCode(code);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  // Spinning animation with fake random codes
  useEffect(() => {
    if (!settings?.is_spinning) return;

    const interval = setInterval(() => {
      setDisplayCode(generateRandomCode());
    }, SPIN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [settings?.is_spinning]);

  // Reset display when not showing result and not spinning
  useEffect(() => {
    if (!settings?.is_spinning && !settings?.show_result) {
      setDisplayCode(DEFAULT_CODE);
    }
  }, [settings?.is_spinning, settings?.show_result]);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
      if (e.key === "h" || e.key === "H") {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  // Handle file upload for backgrounds
  const handleFileUpload = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      storageKey: string,
      setState: (value: string | null) => void
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file hình ảnh");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File quá lớn (tối đa 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (!base64) {
          toast.error("Lỗi đọc file");
          return;
        }
        try {
          localStorage.setItem(storageKey, base64);
          setState(base64);
        } catch {
          toast.error("Không thể lưu ảnh (localStorage đầy)");
        }
      };
      reader.onerror = () => {
        toast.error("Lỗi khi đọc file ảnh");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, BACKGROUND_STORAGE_KEY, setLocalBackground);
  };

  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, POPUP_BACKGROUND_STORAGE_KEY, setPopupBackground);
  };

  // Remove main background
  const removeBackground = () => {
    setLocalBackground(null);
    localStorage.removeItem(BACKGROUND_STORAGE_KEY);
  };

  // Remove popup background
  const removePopupBackground = () => {
    setPopupBackground(null);
    localStorage.removeItem(POPUP_BACKGROUND_STORAGE_KEY);
  };

  // Determine which background to use
  const backgroundImage = localBackground || settings?.background_url;
  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : {};

  const popupBackgroundStyle = popupBackground
    ? { backgroundImage: `url(${popupBackground})` }
    : {};

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen flex items-center justify-center bg-black"
    >
      <div
        className="h-full max-h-screen aspect-[9/16] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={backgroundStyle}
      >
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={popupFileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePopupFileChange}
          className="hidden"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Control buttons */}
        {showControls && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
              title="Thêm background chính"
            >
              <ImagePlus className="w-6 h-6 text-white" />
            </button>

            {localBackground && (
              <button
                onClick={removeBackground}
                className="p-3 bg-red-500/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition-colors"
                title="Xóa background chính"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            )}

            <button
              onClick={() => popupFileInputRef.current?.click()}
              className="p-3 bg-green-500/50 hover:bg-green-500/70 rounded-lg backdrop-blur-sm transition-colors"
              title="Thêm background popup trúng thưởng"
            >
              <Gift className="w-6 h-6 text-white" />
            </button>

            {popupBackground && (
              <button
                onClick={removePopupBackground}
                className="p-3 bg-orange-500/50 hover:bg-orange-500/70 rounded-lg backdrop-blur-sm transition-colors"
                title="Xóa background popup"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
              title={isFullscreen ? "Thoát fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6 text-white" />
              ) : (
                <Maximize className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Main Content - Lucky code display */}
        <div className="relative z-10 text-center px-4">
          <p className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold tracking-[0.1em] select-none text-white">
            {displayCode}
          </p>
        </div>

        {/* Winner Popup */}
        {settings?.show_result && settings?.winning_name && (
          <div className="fixed inset-0 z-30 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
              className="relative w-[70%] max-w-[400px] aspect-square rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-cover bg-center bg-no-repeat"
              style={popupBackgroundStyle}
            >
              {!popupBackground && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-red-500/90" />
              )}

              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                {settings?.current_prize && (
                  <div className="mb-4">
                    <span className="px-6 py-2 text-white text-xl md:text-2xl font-semibold">
                      {settings.current_prize}
                    </span>
                  </div>
                )}

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">
                  CHÚC MỪNG
                </h2>

                <div className="mb-4">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg animate-pulse">
                    {settings.winning_name}
                  </p>
                </div>

                <div className="px-6 py-3">
                  <p className="text-white/80 text-base mb-1">Mã số may mắn</p>
                  <p className="font-mono text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                    {settings.winning_code}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hint */}
        {showControls && (
          <div className="absolute bottom-4 left-4 z-20 text-white/50 text-sm space-y-1">
            <p>F - Fullscreen | H - Ẩn/hiện controls</p>
          </div>
        )}
      </div>
    </div>
  );
}
