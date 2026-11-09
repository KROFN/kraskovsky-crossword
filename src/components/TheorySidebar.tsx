import { BookOpen, Check, LockKeyhole } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

interface Props {
  solvedEntries: Set<number>;
  selectedEntryId: number | null;
}

export default function TheorySidebar({ solvedEntries, selectedEntryId }: Props) {
  return (
    <div className="fc-theory">
      <p className="fc-theory-intro">Каждое разгаданное слово открывает короткое объяснение финансового термина.</p>
      <div className="fc-theory-list">
        {CROSSWORD_ENTRIES.map((entry) => {
          const solved = solvedEntries.has(entry.id);
          return (
            <article
              key={entry.id}
              className={`fc-theory-card ${solved ? 'is-unlocked' : ''} ${selectedEntryId === entry.id ? 'is-current' : ''}`}
            >
              <div className="fc-theory-card-top">
                <span className="fc-theory-index">{String(entry.number).padStart(2,'0')}</span>
                {solved ? <Check size={14} aria-label="Открыто" /> : <LockKeyhole size={14} aria-label="Закрыто" />}
              </div>
              <h4>{solved ? entry.word : 'Термин закрыт'}</h4>
              <p>{solved ? entry.theory : 'Разгадайте слово, чтобы открыть объяснение.'}</p>
              {solved ? <span className="fc-theory-unlocked"><BookOpen size={12}/> ОТКРЫТО</span> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
