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

const generateDefaultCodes = (count: number): string[] => {
  return Array(count).fill(DEFAULT_CODE);
};

export function useSpinAnimation(settings: DrawSettings | null) {
  const [displayCodes, setDisplayCodes] = useState<string[]>([DEFAULT_CODE]);

  // Update display codes when result is shown
  useEffect(() => {
    if (settings?.show_result && settings.winning_codes && settings.winning_codes.length > 0) {
      setDisplayCodes(settings.winning_codes);
    }
  }, [settings?.show_result, settings?.winning_codes]);

  // Spinning animation with fake random codes
  useEffect(() => {
    if (!settings?.is_spinning) return;

    const count = settings.draw_mode || 1;

    const interval = setInterval(() => {
      const randomCodes = Array(count)
        .fill(null)
        .map(() => generateRandomCode());
      setDisplayCodes(randomCodes);
    }, SPIN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [settings?.is_spinning, settings?.draw_mode]);

  // Reset display when not showing result and not spinning
  useEffect(() => {
    if (!settings?.is_spinning && !settings?.show_result) {
      const count = settings?.draw_mode || 1;
      setDisplayCodes(generateDefaultCodes(count));
    }
  }, [settings?.is_spinning, settings?.show_result, settings?.draw_mode]);

  return displayCodes;
}
