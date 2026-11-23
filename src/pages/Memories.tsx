import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Lightbox } from "../components/Lightbox";
import { MemoryCard } from "../components/MemoryCard";
import { MemoryEditor } from "../components/MemoryEditor";
import { SectionHeader } from "../components/SectionHeader";
import { useLanguage } from "../hooks/useLanguage";
import { useMemories } from "../hooks/useMemories";
import type { Memory } from "../types";

export function Memories() {
  const { t } = useLanguage();
  const { memories, loading, error, refresh, addMemory, saveMemory, deleteMemory } = useMemories();
  const [active, setActive] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);

  const addButton = (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className="inline-flex items-center gap-2 border border-navy/70 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist"
    >
      <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
      {t.memories.add}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.memories.eyebrow}
        title={t.memories.title}
        jp="記憶"
        description={t.memories.description}
        aside={<span className="label">{t.memories.count(memories.length)}</span>}
      />

      <div className="mt-6 flex justify-end">{addButton}</div>

      {loading ? (
        <div className="mt-10 space-y-10" aria-hidden="true">
          {[0, 1].map((row) => (
            <div key={row} className="grid gap-6 md:grid-cols-2">
              <div className="aspect-[4/3] animate-pulse border border-line/60 bg-white/30" />
              <div className="h-32 animate-pulse border border-line/60 bg-white/30" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 border border-line/80 bg-white/30 p-6">
          <p className="text-[13px] text-muted-strong">{t.memories.loadError}</p>
          <button type="button" onClick={() => void refresh()} className="btn-quiet mt-3">
            {t.memories.retry}
          </button>
        </div>
      ) : memories.length === 0 ? (
        <div className="mt-10">
          <EmptyState title={t.memories.empty} hint={t.memories.emptyHint} />
          <div className="mt-6 flex justify-center">{addButton}</div>
        </div>
      ) : (
        <div className="relative mt-12 md:mt-16">
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[7px] top-0 w-px bg-line/70 md:left-1/2"
          />
          <ol className="space-y-14 md:space-y-20">
            {memories.map((memory, index) => (
              <motion.li
                key={memory.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="pl-7 md:pl-0"
              >
                <MemoryCard
                  memory={memory}
                  index={index}
                  onOpen={() => setActive(index)}
                  onEdit={() => setEditing(memory)}
                />
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      <Lightbox
        memories={memories}
        index={active}
        onClose={() => setActive(null)}
        onChange={setActive}
      />

      {creating && (
        <MemoryEditor
          memory={null}
          onClose={() => setCreating(false)}
          onSave={addMemory}
        />
      )}

      {editing && (
        <MemoryEditor
          memory={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => saveMemory(editing.id, draft)}
          onDelete={() => deleteMemory(editing.id)}
        />
      )}
    </div>
  );
}
