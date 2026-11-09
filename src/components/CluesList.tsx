import { Check, ArrowRight, ArrowDown } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  selectedEntryId: number | null;
  solvedEntries: Set<number>;
  onSelectEntry: (id: number) => void;
}

export default function CluesList({ selectedEntryId, solvedEntries, onSelectEntry }: Props) {
  const groups = [
    { direction: 'across', title: 'Горизонталь', Icon: ArrowRight },
    { direction: 'down', title: 'Вертикаль', Icon: ArrowDown },
  ] as const;

  return (
    <div className="fc-clues">
      {groups.map(({ direction, title, Icon }) => (
        <section className="fc-clue-group" key={direction} aria-label={title}>
          <div className="fc-clue-group-heading">
            <span className="fc-clue-group-icon"><Icon size={15} /></span>
            <h3>{title}</h3>
            <span className="fc-clue-group-count">{CROSSWORD_ENTRIES.filter(entry => entry.direction === direction).length}</span>
          </div>
          <div className="fc-clue-stack">
            {CROSSWORD_ENTRIES.filter(entry => entry.direction === direction).map(entry => {
              const selected = selectedEntryId === entry.id;
              const solved = solvedEntries.has(entry.id);
              return (
                <button
                  type="button"
                  key={entry.id}
                  className={`fc-clue-item ${selected ? 'is-active' : ''} ${solved ? 'is-solved' : ''}`}
                  onClick={() => onSelectEntry(entry.id)}
                  aria-pressed={selected}
                >
                  <span className="fc-clue-number">{String(entry.number).padStart(2, '0')}</span>
                  <span className="fc-clue-text">{entry.clue}</span>
                  {solved ? <Check className="fc-clue-check" size={16} aria-label="Разгадано" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
