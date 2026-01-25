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
  const displayCodes = useSpinAnimation(settings);
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

  // Calculate layout based on draw mode
  const drawMode = settings?.draw_mode || 1;
  const winnersPerRow = 5;
  const needsMultipleRows = drawMode > winnersPerRow;
  const firstRowCount = Math.min(drawMode, winnersPerRow);
  const secondRowCount = Math.max(0, drawMode - winnersPerRow);

  // Dynamic font size based on winner count
  const getFontSize = (count: number) => {
    if (count === 1) return "text-5xl sm:text-6xl md:text-7xl";
    if (count <= 3) return "text-3xl sm:text-4xl md:text-5xl";
    if (count <= 5) return "text-2xl sm:text-3xl md:text-4xl";
    if (count <= 7) return "text-xl sm:text-2xl md:text-3xl";
    return "text-lg sm:text-xl md:text-2xl";
  };

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
  const backgroundStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};

  return (
    <div ref={containerRef} className="w-screen h-screen flex items-center justify-center bg-black">
      <div
        className="h-full max-h-screen aspect-[16/9] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 bg-cover bg-center bg-no-repeat relative overflow-hidden"
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
        <div className="relative z-10 text-center px-4 w-full max-w-7xl">
          {drawMode === 1 ? (
            // Single winner - large centered display
            <p
              className={`font-mono ${getFontSize(
                1
              )} font-bold tracking-[0.1em] select-none text-white`}
            >
              {displayCodes[0]}
            </p>
          ) : needsMultipleRows ? (
            // Multiple rows (6-10 winners)
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-center gap-2 sm:gap-3">
                {displayCodes.slice(0, firstRowCount).map((code, idx) => (
                  <div
                    key={idx}
                    className={`font-mono ${getFontSize(
                      drawMode
                    )} font-bold tracking-wider select-none text-white bg-black/20 px-2 sm:px-3 py-2 rounded-lg backdrop-blur-sm`}
                  >
                    {code}
                  </div>
                ))}
              </div>
              {secondRowCount > 0 && (
                <div className="flex justify-center gap-2 sm:gap-3">
                  {displayCodes.slice(firstRowCount, drawMode).map((code, idx) => (
                    <div
                      key={idx + firstRowCount}
                      className={`font-mono ${getFontSize(
                        drawMode
                      )} font-bold tracking-wider select-none text-white bg-black/20 px-2 sm:px-3 py-2 rounded-lg backdrop-blur-sm`}
                    >
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Single row (2-5 winners)
            <div className="flex justify-center gap-3 sm:gap-4">
              {displayCodes.map((code, idx) => (
                <div
                  key={idx}
                  className={`font-mono ${getFontSize(
                    drawMode
                  )} font-bold tracking-wider select-none text-white bg-black/20 px-3 sm:px-4 py-2 sm:py-3 rounded-lg backdrop-blur-sm`}
                >
                  {code}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Winner Popup */}
        {settings?.show_result && settings?.winning_count > 0 && (
          <WinnerPopup settings={settings} popupBackground={popupBackground} />
        )}
      </div>
    </div>
  );
}
