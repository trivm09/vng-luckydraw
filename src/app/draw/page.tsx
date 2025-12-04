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

interface Customer {
  bracelet_code: string;
  name: string;
}

const BACKGROUND_STORAGE_KEY = "draw_background_image";
const POPUP_BACKGROUND_STORAGE_KEY = "draw_popup_background_image";

export default function DrawPage() {
  const [settings, setSettings] = useState<DrawSettings | null>(null);
  const [displayCode, setDisplayCode] = useState("??????");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localBackground, setLocalBackground] = useState<string | null>(null);
  const [popupBackground, setPopupBackground] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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

  // Fetch initial settings and customers
  useEffect(() => {
    const fetchData = async () => {
      const { data: settingsData } = await supabase
        .from("draw_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.show_result && settingsData.winning_code) {
          setDisplayCode(settingsData.winning_code);
        }
      }

      const { data: customersData } = await supabase
        .from("customers")
        .select("bracelet_code, name")
        .eq("has_won", false);

      if (customersData) {
        setCustomers(customersData);
      }
    };

    fetchData();
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
        async (payload) => {
          const newSettings = payload.new as DrawSettings;
          setSettings(newSettings);

          if (newSettings.show_result && newSettings.winning_code) {
            setDisplayCode(newSettings.winning_code);
          }

          if (newSettings.show_result) {
            const { data: customersData } = await supabase
              .from("customers")
              .select("bracelet_code, name")
              .eq("has_won", false);

            if (customersData) {
              setCustomers(customersData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spinning animation
  useEffect(() => {
    if (!settings?.is_spinning || customers.length === 0) return;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * customers.length);
      setDisplayCode(customers[randomIndex].bracelet_code);
    }, 50);

    return () => clearInterval(interval);
  }, [settings?.is_spinning, customers]);

  // Reset display when not showing result and not spinning
  useEffect(() => {
    if (!settings?.is_spinning && !settings?.show_result) {
      setDisplayCode("??????");
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

  // Max file size: 2MB
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Handle main background file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        localStorage.setItem(BACKGROUND_STORAGE_KEY, base64);
        setLocalBackground(base64);
      } catch {
        toast.error("Không thể lưu ảnh (localStorage đầy)");
      }
    };
    reader.onerror = () => {
      toast.error("Lỗi khi đọc file ảnh");
    };
    reader.readAsDataURL(file);
  };

  // Handle popup background file upload
  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        localStorage.setItem(POPUP_BACKGROUND_STORAGE_KEY, base64);
        setPopupBackground(base64);
      } catch {
        toast.error("Không thể lưu ảnh (localStorage đầy)");
      }
    };
    reader.onerror = () => {
      toast.error("Lỗi khi đọc file ảnh");
    };
    reader.readAsDataURL(file);
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
      className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        ...backgroundStyle,
        aspectRatio: "16/9",
      }}
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
          {/* Upload main background button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
            title="Thêm background chính"
          >
            <ImagePlus className="w-6 h-6 text-white" />
          </button>

          {/* Remove main background button */}
          {localBackground && (
            <button
              onClick={removeBackground}
              className="p-3 bg-red-500/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition-colors"
              title="Xóa background chính"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Upload popup background button */}
          <button
            onClick={() => popupFileInputRef.current?.click()}
            className="p-3 bg-green-500/50 hover:bg-green-500/70 rounded-lg backdrop-blur-sm transition-colors"
            title="Thêm background popup trúng thưởng"
          >
            <Gift className="w-6 h-6 text-white" />
          </button>

          {/* Remove popup background button */}
          {popupBackground && (
            <button
              onClick={removePopupBackground}
              className="p-3 bg-orange-500/50 hover:bg-orange-500/70 rounded-lg backdrop-blur-sm transition-colors"
              title="Xóa background popup"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Fullscreen button */}
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
      <div className="relative z-10 text-center">
        <div className="relative">
          <div
            className={`font-mono text-7xl md:text-9xl lg:text-[12rem] font-bold tracking-[0.2em] select-none text-white`}
          >
            {displayCode}
          </div>
        </div>
      </div>

      {/* Winner Popup */}
      {settings?.show_result && settings?.winning_name && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          {/* Popup backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Popup content */}
          <div
            className="relative w-[90vw] max-w-3xl aspect-square rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-cover bg-center bg-no-repeat"
            style={popupBackgroundStyle}
          >
            {/* Inner overlay for better text visibility */}
            {!popupBackground && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-red-500/90" />
            )}

            {/* Popup inner content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
              {/* Prize name */}
              {settings?.current_prize && (
                <div className="mb-4">
                  <span className="px-6 py-2 text-white text-xl md:text-2xl font-semibold">
                    {settings.current_prize}
                  </span>
                </div>
              )}

              {/* Congratulations text */}
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                CHÚC MỪNG
              </h2>

              {/* Winner name */}
              <div className="mb-6">
                <p className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg animate-pulse">
                  {settings.winning_name}
                </p>
              </div>

              {/* Winning code */}
              <div className="px-8 py-4">
                <p className="text-white/80 text-lg mb-1">Mã số may mắn</p>
                <p className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold text-white">
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
  );
}
