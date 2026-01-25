import { DrawSettings } from "@/hooks/draw/useDrawSettings";

interface WinnerPopupProps {
  settings: DrawSettings;
  popupBackground: string | null;
}

export function WinnerPopup({ settings, popupBackground }: WinnerPopupProps) {
  const popupBackgroundStyle = popupBackground
    ? { backgroundImage: `url(${popupBackground})` }
    : {};

  const winnerCount = settings.winning_count || 0;
  const isSingleWinner = winnerCount === 1;
  const winningCodes = settings.winning_codes || [];
  const winningNames = settings.winning_names || [];

  // Calculate layout
  const winnersPerRow = 5;
  const needsTwoRows = winnerCount > winnersPerRow;
  const firstRowCount = Math.min(winnerCount, winnersPerRow);
  const secondRowCount = Math.max(0, winnerCount - winnersPerRow);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`relative w-full rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-cover bg-center bg-no-repeat ${
          isSingleWinner
            ? "max-w-[min(80vw,80vh,400px)] aspect-square"
            : "max-w-[90vw] max-h-[85vh]"
        }`}
        style={popupBackgroundStyle}
      >
        {!popupBackground && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-red-500/90" />
        )}

        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center">
          {/* Prize Title */}
          {settings.current_prize && (
            <div className="mb-3 sm:mb-6">
              <span className="px-4 sm:px-6 py-2 text-white text-xl sm:text-2xl md:text-3xl font-semibold">
                {settings.current_prize}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-6 drop-shadow-lg">
            CHÚC MỪNG
          </h2>

          {isSingleWinner ? (
            // Single winner - centered large display
            <>
              <div className="mb-3 sm:mb-4">
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg animate-pulse break-words max-w-full">
                  {winningNames[0]}
                </p>
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3">
                <p className="text-white/80 text-sm sm:text-base mb-1">Mã số may mắn</p>
                <p className="font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {winningCodes[0]}
                </p>
              </div>
            </>
          ) : (
            // Multiple winners - grid layout
            <div className="w-full space-y-4 overflow-y-auto max-h-[60vh]">
              {needsTwoRows ? (
                // 6-10 winners - 2 rows
                <>
                  <div className="grid grid-cols-5 gap-3 sm:gap-4">
                    {winningNames.slice(0, firstRowCount).map((name, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 rounded-lg p-3 sm:p-4 backdrop-blur-sm"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm sm:text-base mx-auto mb-2">
                          {idx + 1}
                        </div>
                        <p className="font-bold text-sm sm:text-base md:text-lg text-gray-800 mb-1 truncate">
                          {name}
                        </p>
                        <p className="font-mono text-xs sm:text-sm md:text-base font-semibold text-orange-600">
                          {winningCodes[idx]}
                        </p>
                      </div>
                    ))}
                  </div>
                  {secondRowCount > 0 && (
                    <div className="grid grid-cols-5 gap-3 sm:gap-4">
                      {winningNames.slice(firstRowCount, winnerCount).map((name, idx) => (
                        <div
                          key={idx + firstRowCount}
                          className="bg-white/90 rounded-lg p-3 sm:p-4 backdrop-blur-sm"
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm sm:text-base mx-auto mb-2">
                            {idx + firstRowCount + 1}
                          </div>
                          <p className="font-bold text-sm sm:text-base md:text-lg text-gray-800 mb-1 truncate">
                            {name}
                          </p>
                          <p className="font-mono text-xs sm:text-sm md:text-base font-semibold text-orange-600">
                            {winningCodes[idx + firstRowCount]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // 2-5 winners - 1 row
                <div className={`grid grid-cols-${winnerCount} gap-4 sm:gap-6`}>
                  {winningNames.map((name, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 rounded-lg p-4 sm:p-6 backdrop-blur-sm"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-base sm:text-lg mx-auto mb-3">
                        {idx + 1}
                      </div>
                      <p className="font-bold text-base sm:text-lg md:text-xl text-gray-800 mb-2 truncate">
                        {name}
                      </p>
                      <p className="font-mono text-sm sm:text-base md:text-lg font-semibold text-orange-600">
                        {winningCodes[idx]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
