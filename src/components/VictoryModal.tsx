import { type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { Clock3, RotateCcw, ShieldCheck, Sparkles, Trophy, ArrowUpRight } from 'lucide-react';

interface Props {
  isVisible: boolean;
  score: number;
  elapsedLabel: string;
  accuracy: number;
  hintUsed: number;
  checkCount: number;
  onReset: () => void;
}

export default function VictoryModal({ isVisible, score, elapsedLabel, accuracy, hintUsed, checkCount, onReset }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible ? (
        <>
          {!reduceMotion ? <ReactConfetti recycle={false} numberOfPieces={180} colors={['#d9f0a1','#f48c69','#f2f1eb','#a5c8b8']} style={{ position: 'fixed', inset: 0, zIndex: 201, pointerEvents: 'none' }} /> : null}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fc-victory-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fc-victory-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              className="fc-victory-card"
            >
              <div className="fc-victory-topline"><span>FINCROSS / ВЫПУСК 001</span><ArrowUpRight size={20}/></div>
              <span className="fc-victory-trophy"><Trophy size={31} strokeWidth={1.8}/></span>
              <p className="fc-victory-eyebrow">ВСЕ ДВАДЦАТЬ СЛОВ СОБРАНЫ</p>
              <h2 id="fc-victory-title">Дело<br/><em>в словах.</em></h2>
              <p className="fc-victory-description">Ты прошёл весь финансовый кроссворд. Теперь понятия, которые вчера казались сложными, уже не выглядят такими чужими.</p>
              <div className="fc-victory-stats">
                <ResultCard icon={<Trophy size={15}/>} value={score.toLocaleString('ru-RU')} label="ОЧКИ"/>
                <ResultCard icon={<Clock3 size={15}/>} value={elapsedLabel} label="ВРЕМЯ"/>
                <ResultCard icon={<ShieldCheck size={15}/>} value={`${accuracy}%`} label="ТОЧНОСТЬ"/>
                <ResultCard icon={<Sparkles size={15}/>} value={`${hintUsed} / ${checkCount}`} label="ПОДСК. / ПРОВ."/>
              </div>
              <button type="button" className="fc-victory-again" onClick={onReset}><RotateCcw size={17}/> Пройти ещё раз</button>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ResultCard({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return <div className="fc-victory-stat"><div>{icon}<span>{label}</span></div><strong>{value}</strong></div>;
}
