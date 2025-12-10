import { DrawSettings } from "@/hooks/draw/useDrawSettings";

interface WinnerPopupProps {
  settings: DrawSettings;
  popupBackground: string | null;
}

export function WinnerPopup({ settings, popupBackground }: WinnerPopupProps) {
  const popupBackgroundStyle = popupBackground
    ? { backgroundImage: `url(${popupBackground})` }
    : {};

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[min(80vw,80vh,400px)] aspect-square rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-cover bg-center bg-no-repeat"
        style={popupBackgroundStyle}
      >
        {!popupBackground && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-red-500/90" />
        )}

        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center">
          {settings.current_prize && (
            <div className="mb-2 sm:mb-4">
              <span className="px-4 sm:px-6 py-2 text-white text-lg sm:text-xl md:text-2xl font-semibold">
                {settings.current_prize}
              </span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
            CHÚC MỪNG
          </h2>

          <div className="mb-2 sm:mb-4">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg animate-pulse break-words max-w-full">
              {settings.winning_name}
            </p>
          </div>

          <div className="px-4 sm:px-6 py-2 sm:py-3">
            <p className="text-white/80 text-sm sm:text-base mb-1">Mã số may mắn</p>
            <p className="font-mono text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              {settings.winning_code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
