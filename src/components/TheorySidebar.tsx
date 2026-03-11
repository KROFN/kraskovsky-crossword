import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lock } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedEntries: Set<number>;
  selectedEntryId: number | null;
}

export default function TheorySidebar({ solvedEntries, selectedEntryId }: Props) {
  const totalSolved = solvedEntries.size;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-5 rounded-full bg-violet-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
          Теория
        </h3>
        <span className="ml-auto text-xs font-mono text-white/30">
          {totalSolved}/{CROSSWORD_ENTRIES.length}
        </span>
      </div>

      {/* Intro hint */}
      {totalSolved === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
        >
          <Lock size={20} className="mx-auto mb-2 text-white/30" />
          <p className="text-xs text-white/40 leading-relaxed">
            Угадывайте слова в кроссворде, чтобы открывать карточки с теорией
          </p>
        </motion.div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {CROSSWORD_ENTRIES.map((entry) => {
          const isSolved = solvedEntries.has(entry.id);
          const isSelected = selectedEntryId === entry.id;

          return (
            <TheoryCard
              key={entry.id}
              word={entry.word}
              number={entry.number}
              theory={entry.theory}
              direction={entry.direction}
              isSolved={isSolved}
              isSelected={isSelected}
            />
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Individual Theory Card
// ──────────────────────────────────────────────────────────────
interface CardProps {
  word: string;
  number: number;
  theory: string;
  direction: 'across' | 'down';
  isSolved: boolean;
  isSelected: boolean;
}

function TheoryCard({ word, number, theory, direction, isSolved, isSelected }: CardProps) {


  return (
    <motion.div
      layout
      initial={false}
      className={`
        relative rounded-xl border overflow-hidden transition-all duration-300
        ${isSolved
          ? isSelected
            ? 'bg-violet-500/20 border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
            : 'bg-white/5 border-white/10'
          : 'bg-white/3 border-white/5 opacity-60'}
      `}
    >
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`
              text-xs font-mono px-1.5 py-0.5 rounded-md font-bold
              ${isSolved ? 'bg-violet-500/30 text-violet-300' : 'bg-white/8 text-white/30'}
            `}
          >
            {number}{direction === 'across' ? '→' : '↓'}
          </span>

          <AnimatePresence mode="wait">
            {isSolved ? (
              <motion.span
                key="word"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5 }}
                className="text-sm font-bold text-white tracking-wider uppercase"
              >
                {word}
              </motion.span>
            ) : (
              <motion.span
                key="hidden"
                className="text-sm font-bold text-white/20 tracking-widest"
              >
                {'●'.repeat(Math.min(word.length, 8))}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Theory text */}
        <AnimatePresence>
          {isSolved && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="flex items-start gap-1.5 mt-1">
                <BookOpen size={11} className="flex-shrink-0 text-violet-400 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">{theory}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glow accent for solved */}
      {isSolved && (
        <div className="absolute top-0 left-0 w-1 h-full bg-violet-400 rounded-l-xl" />
      )}
    </motion.div>
  );
}
