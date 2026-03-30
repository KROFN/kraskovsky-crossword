import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Clock3, RotateCcw, TrendingUp, Trophy } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedCount: number;
  score: number;
  elapsedLabel: string;
  onReset: () => void;
}

export default function Header({
  solvedCount,
  score,
  elapsedLabel,
  onReset,
}: Props) {
  const total = CROSSWORD_ENTRIES.length;
  const pct = Math.round((solvedCount / total) * 100);

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-[#ccff00]/20 blur-sm" />
          <TrendingUp size={18} className="text-[#ccff00] relative z-10" />
        </div>
        <span className="text-lg font-black tracking-tight text-white">
          Fin<span className="text-[#ccff00]">Cross</span>
        </span>
        <span className="hidden sm:inline-block text-xs text-white/30 font-mono ml-1">
          v1.1
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1">
            <motion.span
              key={solvedCount}
              initial={{ scale: 1.4, color: '#ccff00' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.3 }}
              className="text-base font-black font-mono tabular-nums"
            >
              {solvedCount}
            </motion.span>
            <span className="text-white/30 font-mono text-base">/</span>
            <span className="text-white/50 font-mono text-base font-bold">{total}</span>
          </div>

          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#ccff00] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <span className="text-xs text-white/40 font-mono tabular-nums">{pct}%</span>
        </div>

        <InfoPill icon={<Trophy size={12} />} label="Очки" value={score} accent="text-emerald-300" />
        <InfoPill icon={<Clock3 size={12} />} label="Время" value={elapsedLabel} accent="text-sky-300" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <RotateCcw size={12} />
          <span className="hidden sm:inline">Сбросить</span>
        </motion.button>
      </motion.div>
    </header>
  );
}

function InfoPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="hidden xl:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
      <span className="text-white/35">{icon}</span>
      <span className="text-[11px] uppercase tracking-widest text-white/30">{label}</span>
      <span className={`text-sm font-mono font-bold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}
