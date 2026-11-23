import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** A hairline that fills as the page is read, like a signal strength bar. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: reduceMotion ? scrollYProgress : scaleX }}
      className="fixed inset-x-0 top-16 z-40 h-px origin-left bg-ember/70"
    />
  );
}
