import { Maximize, Minimize, ImagePlus, X, Gift } from "lucide-react";

interface ControlButtonsProps {
  isFullscreen: boolean;
  localBackground: string | null;
  popupBackground: string | null;
  onToggleFullscreen: () => void;
  onOpenMainFileDialog: () => void;
  onOpenPopupFileDialog: () => void;
  onRemoveBackground: () => void;
  onRemovePopupBackground: () => void;
}

export function ControlButtons({
  isFullscreen,
  localBackground,
  popupBackground,
  onToggleFullscreen,
  onOpenMainFileDialog,
  onOpenPopupFileDialog,
  onRemoveBackground,
  onRemovePopupBackground,
}: ControlButtonsProps) {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      <button
        onClick={onOpenMainFileDialog}
        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
        title="Thêm background chính"
      >
        <ImagePlus className="w-6 h-6 text-white" />
      </button>

      {localBackground && (
        <button
          onClick={onRemoveBackground}
          className="p-3 bg-red-500/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition-colors"
          title="Xóa background chính"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      )}

      <button
        onClick={onOpenPopupFileDialog}
        className="p-3 bg-green-500/50 hover:bg-green-500/70 rounded-lg backdrop-blur-sm transition-colors"
        title="Thêm background popup trúng thưởng"
      >
        <Gift className="w-6 h-6 text-white" />
      </button>

      {popupBackground && (
        <button
          onClick={onRemovePopupBackground}
          className="p-3 bg-orange-500/50 hover:bg-orange-500/70 rounded-lg backdrop-blur-sm transition-colors"
          title="Xóa background popup"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      )}

      <button
        onClick={onToggleFullscreen}
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
  );
}
