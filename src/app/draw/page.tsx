"use client";

import { useState, useEffect, useRef } from "react";
import { useDrawSettings } from "@/hooks/draw/useDrawSettings";
import { useFullscreen } from "@/hooks/draw/useFullscreen";
import { useSpinAnimation } from "@/hooks/draw/useSpinAnimation";
import { useBackgroundUpload } from "@/hooks/draw/useBackgroundUpload";
import { ControlButtons } from "@/components/draw/ControlButtons";
import { WinnerPopup } from "@/components/draw/WinnerPopup";

export default function DrawPage() {
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const settings = useDrawSettings();
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const displayCode = useSpinAnimation(settings);
  const {
    localBackground,
    popupBackground,
    fileInputRef,
    popupFileInputRef,
    handleMainFileChange,
    handlePopupFileChange,
    removeBackground,
    removePopupBackground,
    openMainFileDialog,
    openPopupFileDialog,
  } = useBackgroundUpload();

  // Keyboard shortcut for hiding controls (H key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine which background to use
  const backgroundImage = localBackground || settings?.background_url;
  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
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
          onChange={handleMainFileChange}
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
          <ControlButtons
            isFullscreen={isFullscreen}
            localBackground={localBackground}
            popupBackground={popupBackground}
            onToggleFullscreen={toggleFullscreen}
            onOpenMainFileDialog={openMainFileDialog}
            onOpenPopupFileDialog={openPopupFileDialog}
            onRemoveBackground={removeBackground}
            onRemovePopupBackground={removePopupBackground}
          />
        )}

        {/* Main Content - Lucky code display */}
        <div className="relative z-10 text-center px-4">
          <p className="font-mono text-5xl sm:text-6xl md:text-7xl font-bold tracking-[0.1em] select-none text-white">
            {displayCode}
          </p>
        </div>

        {/* Winner Popup */}
        {settings?.show_result && settings?.winning_name && (
          <WinnerPopup settings={settings} popupBackground={popupBackground} />
        )}
      </div>
    </div>
  );
}
