import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { Clock3, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

interface Props {
  isVisible: boolean;
  score: number;
  elapsedLabel: string;
  accuracy: number;
  hintUsed: number;
  checkCount: number;
  onReset: () => void;
}

export default function VictoryModal({
  isVisible,
  score,
  elapsedLabel,
  accuracy,
  hintUsed,
  checkCount,
  onReset,
}: Props) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <>
          <ReactConfetti
            recycle={false}
            numberOfPieces={500}
            colors={['#ccff00', '#a3d900', '#ffffff', '#8b5cf6', '#34d399']}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 200 }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            style={{ zIndex: 100 }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative bg-[#111] border border-[#ccff00]/30 rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center shadow-[0_0_60px_rgba(204,255,0,0.2)]"
            >
              <div className="absolute inset-0 rounded-3xl bg-[#ccff00]/5 pointer-events-none" />

              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
                className="mx-auto w-20 h-20 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center mb-6"
              >
                <Trophy size={40} className="text-[#ccff00]" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-black text-white mb-2"
              >
                Ты финансовый
                <br />
                <span className="text-[#ccff00]">эксперт!</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-sm leading-relaxed mb-8 max-w-md mx-auto"
              >
                Все 20 терминов разгаданы. Теперь у прохождения есть не только финал,
                но и полноценный результат: время, score, точность и дисциплина по
                подсказкам.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
              >
                <ResultCard icon={<Trophy size={14} />} value={score} label="очки" accent="text-emerald-300" />
                <ResultCard icon={<Clock3 size={14} />} value={elapsedLabel} label="время" accent="text-sky-300" />
                <ResultCard icon={<ShieldCheck size={14} />} value={`${accuracy}%`} label="точность" accent="text-violet-300" />
                <ResultCard icon={<Sparkles size={14} />} value={`${hintUsed}/${checkCount}`} label="hint/check" accent="text-amber-300" />
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 bg-[#ccff00] hover:bg-[#d9ff33] text-black font-bold py-3.5 rounded-2xl transition-colors duration-200"
              >
                <RotateCcw size={16} />
                Начать заново
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ResultCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-4 text-left">
      <div className="flex items-center gap-2 text-white/35 mb-3">
        {icon}
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-2xl font-black font-mono tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
