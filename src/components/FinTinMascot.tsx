"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface FinTinMascotProps {
  /** Bounding box size in pixels (width & height). The mascot's own aspect ratio is preserved. */
  size?: number;
  className?: string;
}

// Hoisted so the animate/transition objects keep a stable reference across
// re-renders (e.g. parent form state changes). A fresh object/array literal
// on every render can make Framer Motion treat the target as "changed" and
// restart the tween, which can make the loop look like it never plays until
// something else happens to let it run uninterrupted.
const BOB_ANIMATE = { y: -7 };
const BOB_TRANSITION = {
  duration: 2.5,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
} as const;

/**
 * The FinTin mascot: a smiling cloud. Rendered from public/mascot-cloud.svg,
 * which is the source of truth for the mascot's design — do not redraw it
 * inline here.
 *
 * This is the ONLY place the mascot is ever drawn. Every screen that needs
 * the mascot should import and render this component instead of redrawing
 * or hardcoding a copy of it.
 */
export default function FinTinMascot({ size = 64, className }: FinTinMascotProps) {
  return (
    <motion.div
      data-role="mascot"
      className={className}
      style={{ display: "inline-block", lineHeight: 0 }}
      initial={{ y: 0 }}
      animate={BOB_ANIMATE}
      transition={BOB_TRANSITION}
    >
      <Image
        src="/mascot-cloud.svg"
        alt="FinTin mascot: a smiling cloud"
        width={size}
        height={size}
      />
    </motion.div>
  );
}
