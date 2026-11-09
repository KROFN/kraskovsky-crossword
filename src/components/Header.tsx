import { Clock3, RotateCcw } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedCount: number;
  score: number;
  elapsedLabel: string;
  onReset: () => void;
}

export default function Header({ solvedCount, elapsedLabel, onReset }: Props) {
  const percent = Math.round(solvedCount / CROSSWORD_ENTRIES.length * 100);
  return (
    <header className="fc-header">
      <div className="fc-header-inner">
        <div className="fc-identity">
          <span className="fc-mark" aria-hidden="true">F<span>·</span></span>
          <div><strong>FINCROSS</strong><small>Финансовый кроссворд</small></div>
        </div>
        <div className="fc-header-status">
          <span className="fc-header-timer"><Clock3 size={16} aria-hidden="true"/> {elapsedLabel}</span>
          <div className="fc-header-progress" aria-label={`Разгадано ${solvedCount} из ${CROSSWORD_ENTRIES.length} слов`}>
            <div className="fc-progress-track" role="progressbar" aria-label="Прохождение" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
              <span style={{ width: `${percent}%` }} />
            </div>
            <strong>{solvedCount}<span>/{CROSSWORD_ENTRIES.length}</span></strong>
          </div>
          <button type="button" className="fc-reset-button" onClick={onReset} aria-label="Начать кроссворд заново" title="Начать заново">
            <RotateCcw size={16} /><span>Сбросить</span>
          </button>
        </div>
      </div>
    </header>
  );
}
