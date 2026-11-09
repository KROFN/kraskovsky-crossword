import { RotateCcw, Timer, ArrowUpRight, ChartNoAxesCombined } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedCount: number;
  score: number;
  elapsedLabel: string;
  onReset: () => void;
}

export default function Header({ solvedCount, elapsedLabel, onReset }: Props) {
  const percent = Math.round((solvedCount / CROSSWORD_ENTRIES.length) * 100);

  return (
    <header className="fc-topbar">
      <a className="fc-brand" href="/" aria-label="FINCROSS — к началу игры">
        <span className="fc-brand-symbol"><ChartNoAxesCombined size={20} strokeWidth={2.4} /></span>
        <span className="fc-brand-name">FIN<span>CROSS</span><small>© 2026</small></span>
      </a>
      <div className="fc-topbar-meta" aria-label="Прогресс прохождения">
        <span className="fc-topbar-label">ВАШ ПРОГРЕСС</span>
        <div className="fc-topbar-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Пройдено">
          <span style={{ width: `${percent}%` }} />
        </div>
        <strong>{percent}%</strong>
      </div>
      <div className="fc-topbar-actions">
        <div className="fc-topbar-time"><Timer size={16} /><span>{elapsedLabel}</span></div>
        <button className="fc-reset-button" type="button" onClick={onReset} title="Начать кроссворд заново">
          <RotateCcw size={15} /><span>Заново</span>
        </button>
      </div>
      <span className="fc-topbar-edge" aria-hidden="true"><ArrowUpRight size={19} /></span>
    </header>
  );
}
