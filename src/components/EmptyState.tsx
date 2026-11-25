import { motion } from "framer-motion";
import { Blossom } from "./Marks";

interface EmptyStateProps {
  title: string;
  hint?: string;
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="paper-tint flex flex-col items-center justify-center border-dashed px-6 py-16 text-center"
    >
      <span aria-hidden="true" className="relative mb-5 flex h-12 w-12 items-center justify-center">
        <Blossom className="bloom-in h-9 w-9 text-periwinkle" />
      </span>
      <p className="font-display text-xl italic text-navy">{title}</p>
      {hint && (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-strong">{hint}</p>
      )}
    </motion.div>
  );
}
