import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface TypingTextProps {
  text: string;
  className?: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Delay before typing starts, in milliseconds. */
  delay?: number;
  showCaret?: boolean;
}

export function TypingText({
  text,
  className,
  speed = 32,
  delay = 0,
  showCaret = true,
}: TypingTextProps) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setCount(text.length);
      return;
    }

    setCount(0);
    let index = 0;
    let interval: number | undefined;

    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setCount(index);
        if (index >= text.length && interval) window.clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speed, delay, reduceMotion]);

  const complete = count >= text.length;

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, count)}
        {!complete && showCaret && <span className="caret" />}
      </span>
    </span>
  );
}
