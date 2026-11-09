import { BookOpen, CheckCircle2 } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedEntries: Set<number>;
  selectedEntryId: number | null;
}

export default function TheorySidebar({ solvedEntries, selectedEntryId }: Props) {
  const unlocked = CROSSWORD_ENTRIES.filter(entry => solvedEntries.has(entry.id));
  const remaining = CROSSWORD_ENTRIES.length - unlocked.length;

  if (unlocked.length === 0) {
    return (
      <div className="fc-theory-empty">
        <span className="fc-theory-empty-icon"><BookOpen size={26}/></span>
        <h3>Знания откроются по ходу игры</h3>
        <p>Разгадай первое слово. Здесь появится краткое объяснение финансового термина.</p>
      </div>
    );
  }

  return (
    <div className="fc-theory">
      <p className="fc-theory-intro">
        Открыто {unlocked.length} из {CROSSWORD_ENTRIES.length} объяснений.
        {remaining > 0 ? ` Осталось ${remaining}.` : ' Весь справочник собран!'}
      </p>
      <div className="fc-theory-list">
        {unlocked.map(entry => (
          <article key={entry.id} className={`fc-theory-card is-unlocked ${selectedEntryId === entry.id ? 'is-current' : ''}`}>
            <div className="fc-theory-card-top">
              <span className="fc-theory-index">№ {entry.number}</span>
              <CheckCircle2 size={17} aria-label="Термин открыт"/>
            </div>
            <h4>{entry.word}</h4>
            <p>{entry.theory}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
