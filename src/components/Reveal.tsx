import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 18,
  immediate = false,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const hidden = {
    opacity: 0,
    y: reduceMotion ? 0 : distance,
    filter: reduceMotion ? "blur(0px)" : "blur(6px)",
  };
  const visible = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={immediate ? visible : undefined}
      whileInView={immediate ? undefined : visible}
      viewport={immediate ? undefined : { once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
