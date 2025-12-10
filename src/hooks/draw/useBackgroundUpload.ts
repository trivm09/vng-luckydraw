import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const BACKGROUND_STORAGE_KEY = "draw_background_image";
const POPUP_BACKGROUND_STORAGE_KEY = "draw_popup_background_image";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function useBackgroundUpload() {
  const [localBackground, setLocalBackground] = useState<string | null>(null);
  const [popupBackground, setPopupBackground] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupFileInputRef = useRef<HTMLInputElement>(null);

  // Load backgrounds from localStorage on mount
  useEffect(() => {
    const savedBackground = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (savedBackground) {
      setLocalBackground(savedBackground);
    }
    const savedPopupBackground = localStorage.getItem(POPUP_BACKGROUND_STORAGE_KEY);
    if (savedPopupBackground) {
      setPopupBackground(savedPopupBackground);
    }
  }, []);

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

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, BACKGROUND_STORAGE_KEY, setLocalBackground);
  };

  const handlePopupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, POPUP_BACKGROUND_STORAGE_KEY, setPopupBackground);
  };

  const removeBackground = () => {
    setLocalBackground(null);
    localStorage.removeItem(BACKGROUND_STORAGE_KEY);
  };

  const removePopupBackground = () => {
    setPopupBackground(null);
    localStorage.removeItem(POPUP_BACKGROUND_STORAGE_KEY);
  };

  const openMainFileDialog = () => fileInputRef.current?.click();
  const openPopupFileDialog = () => popupFileInputRef.current?.click();

  return {
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
  };
}
