import { useEffect, useRef, type MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  selectedEntryId: number | null;
  solvedEntries: Set<number>;
  onSelectEntry: (id: number) => void;
}

export default function CluesList({ selectedEntryId, solvedEntries, onSelectEntry }: Props) {
  const acrossEntries = CROSSWORD_ENTRIES.filter((e) => e.direction === 'across');
  const downEntries = CROSSWORD_ENTRIES.filter((e) => e.direction === 'down');

  // Refs for every clue button so we can scroll into view
  const clueRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Auto-scroll to the active clue when selectedEntryId changes
  useEffect(() => {
    if (selectedEntryId === null) return;
    const el = clueRefs.current.get(selectedEntryId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEntryId]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <ClueSection
        title="По горизонтали"
        entries={acrossEntries}
        selectedEntryId={selectedEntryId}
        solvedEntries={solvedEntries}
        onSelectEntry={onSelectEntry}
        clueRefs={clueRefs}
      />
      <ClueSection
        title="По вертикали"
        entries={downEntries}
        selectedEntryId={selectedEntryId}
        solvedEntries={solvedEntries}
        onSelectEntry={onSelectEntry}
        clueRefs={clueRefs}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  entries: typeof CROSSWORD_ENTRIES;
  selectedEntryId: number | null;
  solvedEntries: Set<number>;
  onSelectEntry: (id: number) => void;
  clueRefs: MutableRefObject<Map<number, HTMLButtonElement>>;
}

function ClueSection({ title, entries, selectedEntryId, solvedEntries, onSelectEntry, clueRefs }: SectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-5 rounded-full bg-[#ccff00]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{title}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        {entries.map((entry, i) => {
          const isSelected = selectedEntryId === entry.id;
          const isSolved = solvedEntries.has(entry.id);

          return (
            <motion.button
              key={entry.id}
              ref={(el) => {
                if (el) clueRefs.current.set(entry.id, el);
                else clueRefs.current.delete(entry.id);
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              onClick={() => onSelectEntry(entry.id)}
              className={`
                w-full text-left px-3 py-2 rounded-xl transition-all duration-200 group
                flex items-start gap-2
                ${isSelected
                  ? 'bg-[#ccff00]/15 border border-[#ccff00]/50 shadow-[0_0_10px_rgba(204,255,0,0.15)]'
                  : isSolved
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15'}
              `}
            >
              {/* Number badge */}
              <span
                className={`
                  flex-shrink-0 mt-0.5 w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center font-mono
                  ${isSelected ? 'bg-[#ccff00] text-black' : isSolved ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/10 text-white/50'}
                `}
              >
                {entry.number}
              </span>

              {/* Clue text */}
              <span
                className={`
                  flex-1 text-xs leading-relaxed
                  ${isSelected ? 'text-[#ccff00]' : isSolved ? 'text-emerald-400 line-through opacity-70' : 'text-white/70 group-hover:text-white/90'}
                `}
              >
                {entry.clue}
              </span>

              {/* Solved checkmark */}
              {isSolved && (
                <CheckCircle2
                  size={14}
                  className="flex-shrink-0 text-emerald-400 mt-0.5"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
