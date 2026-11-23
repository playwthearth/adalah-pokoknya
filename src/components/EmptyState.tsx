import { motion } from "framer-motion";

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
      className="flex flex-col items-center justify-center border border-dashed border-cyan/80 px-6 py-20 text-center"
    >
      <span aria-hidden="true" className="relative mb-6 flex h-10 w-10 items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-cyan" />
        <span className="absolute h-8 w-8 rounded-full border border-line" />
      </span>
      <p className="font-display text-lg font-light text-navy">{title}</p>
      {hint && <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-strong">{hint}</p>}
    </motion.div>
  );
}
