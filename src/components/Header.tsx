import { Clock3 } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';
import FinCrossMark from './FinCrossMark';

interface Props {
  solvedCount: number;
  elapsedLabel: string;
}

export default function Header({ solvedCount, elapsedLabel }: Props) {
  return (
    <header className="fc-header">
      <div className="fc-header-inner">
        <div className="fc-identity" aria-label="FINCROSS — финансовый кроссворд">
          <FinCrossMark className="fc-logo-symbol" />
          <div className="fc-identity-wordmark">
            <strong>FINCROSS</strong>
            <span>Обществознание / Экономика</span>
          </div>
        </div>
        <div className="fc-header-status">
          <span className="fc-header-time" aria-label={`Время в игре: ${elapsedLabel}`}>
            <Clock3 size={16} aria-hidden="true" /> {elapsedLabel}
          </span>
          <div className="fc-header-divider" aria-hidden="true"/>
          <div className="fc-header-count" aria-label={`Разгадано ${solvedCount} из ${CROSSWORD_ENTRIES.length} слов`}>
            <strong>{String(solvedCount).padStart(2, '0')}</strong>
            <span>/ {CROSSWORD_ENTRIES.length}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
