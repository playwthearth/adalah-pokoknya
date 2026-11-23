import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

/** Eases a number from zero to its value once per change. */
export function CountUp({ value, duration = 1100, className }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduceMotion]);

  return (
    <span className={className} aria-label={String(value)}>
      {shown}
    </span>
  );
}
