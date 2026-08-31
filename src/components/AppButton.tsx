"use client";

import { motion } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";

export type AppButtonVariant = "primary" | "secondary";

export interface AppButtonProps {
  variant?: AppButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const VARIANT_STYLES: Record<
  AppButtonVariant,
  { background: string; color: string; border?: string }
> = {
  primary: { background: "#295EFA", color: "#FFFFFF" },
  secondary: { background: "#FFFFFF", color: "#295EFA", border: "2px solid #295EFA" },
};

/** Clamp a number between a min and max. */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Convert a #rrggbb hex color to HSL. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return { h, s: s * 100, l: l * 100 };
}

/** Convert HSL (h in degrees, s/l in 0-100) back to a #rrggbb hex color. */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Darken a hex color by boosting saturation and reducing lightness, keeping the same hue. */
function darkenColor(hex: string, amount = 0.18): string {
  const { h, s, l } = hexToHsl(hex);
  const nextS = clamp(s + amount * 40, 0, 100);
  const nextL = clamp(l - amount * 100, 0, 100);
  return hslToHex(h, nextS, nextL);
}

/**
 * A pressable button used for every button in the app. Wraps a native
 * <button>, applies a manually computed "pressed" background darken (not
 * CSS :active) on touch/mouse down, and combines it with a Framer Motion
 * tap scale for tactile feedback.
 */
export default function AppButton({
  variant = "primary",
  onClick,
  disabled = false,
  children,
  type = "button",
  className,
}: AppButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const press = useCallback(() => {
    if (!disabled) setIsPressed(true);
  }, [disabled]);

  const release = useCallback(() => {
    setIsPressed(false);
  }, []);

  const { background, color, border } = VARIANT_STYLES[variant];
  const currentBackground = isPressed ? darkenColor(background) : background;

  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{
        backgroundColor: currentBackground,
        color,
        border: border ?? "none",
        borderRadius: 8,
        padding: "14px 24px",
        fontSize: 18,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: "100%",
      }}
    >
      {children}
    </motion.button>
  );
}
