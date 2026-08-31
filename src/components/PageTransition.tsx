"use client";

import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface TransitionFrameProps {
  children: ReactNode;
}

/**
 * One screen's animated frame. `useIsPresent` tells us whether this frame is
 * still the active route (true) or has already been swapped out and is only
 * mounted while AnimatePresence plays its exit transition (false). We expose
 * that as `data-phase` so plain CSS (see globals.css) can animate descendant
 * elements differently based on their `data-role` attribute.
 */
function TransitionFrame({ children }: TransitionFrameProps) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      className="page-transition-frame"
      data-phase={isPresent ? "enter" : "exit"}
      initial={{ y: "100%" }}
      animate={{ y: "0%", transition: { duration: 0.3, ease: "easeOut" } }}
      exit={{ opacity: 1, transition: { duration: 0.2, ease: "easeInOut" } }}
    >
      {children}
    </motion.div>
  );
}

export interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content and animates between routes.
 *
 * Enter: the new screen slides up from y: 100% to y: 0%, ease-out, ~300ms.
 * Exit (~200ms): elements tagged data-role="mascot" slide up and fade,
 * data-role="side-left" slides left and fades, data-role="side-right"
 * slides right and fades, and everything else just fades in place.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <TransitionFrame key={pathname}>{children}</TransitionFrame>
    </AnimatePresence>
  );
}
