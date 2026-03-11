import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { Trophy, RotateCcw } from 'lucide-react';

interface Props {
  isVisible: boolean;
  onReset: () => void;
}

export default function VictoryModal({ isVisible, onReset }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti */}
          <ReactConfetti
            recycle={false}
            numberOfPieces={500}
            colors={['#ccff00', '#a3d900', '#ffffff', '#8b5cf6', '#34d399']}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 200 }}
          />

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-100 flex items-center justify-center p-4"
            style={{ zIndex: 100 }}
          >
            {/* Modal card */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative bg-[#111] border border-[#ccff00]/30 rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-[0_0_60px_rgba(204,255,0,0.2)]"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-[#ccff00]/5 pointer-events-none" />

              {/* Trophy icon */}
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
                className="text-white/50 text-sm leading-relaxed mb-8"
              >
                Все 20 терминов фондового рынка разгаданы. Твои знания в инвестициях
                и трейдинге на высоте — продолжай развиваться!
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-center gap-6 mb-8"
              >
                <div className="text-center">
                  <div className="text-2xl font-black text-[#ccff00] font-mono">20</div>
                  <div className="text-xs text-white/40 mt-0.5">слов</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
                  <div className="text-xs text-white/40 mt-0.5">пройдено</div>
                </div>
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
      )}
    </AnimatePresence>
  );
}
