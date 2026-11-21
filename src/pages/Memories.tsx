import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Lightbox } from "../components/Lightbox";
import { MemoryCard } from "../components/MemoryCard";
import { SectionHeader } from "../components/SectionHeader";
import { memories } from "../data/memories";
import { useLanguage } from "../hooks/useLanguage";

export function Memories() {
  const { t } = useLanguage();
  const [active, setActive] = useState<number | null>(null);

  const ordered = useMemo(
    () => [...memories].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.memories.eyebrow}
        title={t.memories.title}
        jp="記憶"
        description={t.memories.description}
        aside={<span className="label">{t.memories.count(ordered.length)}</span>}
      />

      {ordered.length === 0 ? (
        <div className="mt-10">
          <EmptyState title={t.memories.empty} hint={t.memories.emptyHint} />
        </div>
      ) : (
        <div className="relative mt-12 md:mt-16">
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[7px] top-0 w-px bg-line/70 md:left-1/2"
          />
          <ol className="space-y-14 md:space-y-20">
            {ordered.map((memory, index) => (
              <motion.li
                key={memory.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="pl-7 md:pl-0"
              >
                <MemoryCard memory={memory} index={index} onOpen={() => setActive(index)} />
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      <Lightbox
        memories={ordered}
        index={active}
        onClose={() => setActive(null)}
        onChange={setActive}
      />
    </div>
  );
}
