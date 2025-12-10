import { useState, useEffect } from "react";
import { DrawSettings } from "./useDrawSettings";

const CODE_LENGTH = 6;
const SPIN_CHARS = "0123456789";
const SPIN_INTERVAL_MS = 50;
const DEFAULT_CODE = "??????";

const generateRandomCode = () => {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += SPIN_CHARS.charAt(Math.floor(Math.random() * SPIN_CHARS.length));
  }
  return result;
};

export function useSpinAnimation(settings: DrawSettings | null) {
  const [displayCode, setDisplayCode] = useState(DEFAULT_CODE);

  // Update display code when result is shown
  useEffect(() => {
    if (settings?.show_result && settings.winning_code) {
      setDisplayCode(settings.winning_code);
    }
  }, [settings?.show_result, settings?.winning_code]);

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

  return displayCode;
}
