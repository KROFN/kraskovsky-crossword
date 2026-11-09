import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import type { CrosswordEntry } from '../data/crosswordData';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

const keyFor = (row: number, col: number) => `${row},${col}`;

interface Props {
  entry: CrosswordEntry;
  answers: Record<string, string>;
  solvedEntries: Set<number>;
  revealedCells: Set<string>;
  invalidCells: Set<string>;
  onCellChange: (row: number, col: number, letter: string) => void;
  onNext: () => void;
}

export default function MobileAnswer({
  entry, answers, solvedEntries, revealedCells, invalidCells, onCellChange, onNext,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(0);
  const solved = solvedEntries.has(entry.id);

  // Protect crossings belonging to already-solved words.
  const locked = new Set<string>();
  for (const e of CROSSWORD_ENTRIES) {
    if (!solvedEntries.has(e.id)) continue;
    for (let i = 0; i < e.word.length; i++) {
      locked.add(keyFor(e.row + (e.direction === 'down' ? i : 0), e.col + (e.direction === 'across' ? i : 0)));
    }
  }

  const positions = Array.from({ length: entry.word.length }, (_, index) => ({
    index,
    row: entry.row + (entry.direction === 'down' ? index : 0),
    col: entry.col + (entry.direction === 'across' ? index : 0),
  }));
  const canEdit = (index: number) => !solved && !locked.has(keyFor(positions[index].row, positions[index].col));

  useEffect(() => {
    const firstBlank = positions.find((p) => !locked.has(keyFor(p.row, p.col)) && !answers[keyFor(p.row, p.col)]);
    const firstEditable = positions.find((p) => !locked.has(keyFor(p.row, p.col)));
    setCursor(firstBlank?.index ?? firstEditable?.index ?? 0);
    // Switching words should never open the soft keyboard without a user gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  const findNext = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < positions.length; i += dir) {
      if (canEdit(i)) return i;
    }
    return null;
  };

  const focusPosition = (index: number) => {
    setCursor(index);
    inputRef.current?.focus({ preventScroll: true });
  };

  const onType = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.toUpperCase().replace(/[^А-ЯЁ]/g, '');
    event.target.value = '';
    if (solved || !raw) return;
    let pos = canEdit(cursor) ? cursor : (findNext(cursor - 1, 1) ?? 0);
    for (const letter of raw) {
      if (!canEdit(pos)) break;
      const p = positions[pos];
      onCellChange(p.row, p.col, letter);
      const next = findNext(pos, 1);
      if (next === null) {
        setCursor(pos);
        break;
      }
      pos = next;
      setCursor(next);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (solved) return;
      let index = cursor;
      let p = positions[index];
      if (!canEdit(index) || !answers[keyFor(p.row, p.col)]) {
        index = findNext(cursor, -1) ?? cursor;
        p = positions[index];
      }
      if (canEdit(index)) onCellChange(p.row, p.col, '');
      setCursor(index);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = findNext(cursor, event.key === 'ArrowRight' ? 1 : -1);
      if (next !== null) setCursor(next);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      inputRef.current?.blur();
      onNext();
    }
  };

  return (
    <div className="fc-mobile-answer" aria-label="Ввод выбранного слова">
      <div className="fc-answer-label">
        <span>Ответ · {entry.word.length} букв</span>
        <span>{solved ? 'Разгадано ✓' : 'Нажми на клетку, чтобы ввести букву'}</span>
      </div>
      <div className="fc-answer-tiles" role="group" aria-label={`Ответ на вопрос ${entry.number}`}>
        {positions.map(({ index, row, col }) => {
          const key = keyFor(row, col);
          const value = answers[key] || '';
          const fixed = locked.has(key);
          return (
            <button
              type="button"
              key={key}
              disabled={solved}
              className={['fc-answer-tile', index === cursor && !solved ? 'is-current' : '',
                fixed ? 'is-locked' : '', revealedCells.has(key) ? 'is-revealed' : '',
                invalidCells.has(key) ? 'is-invalid' : '',
                solved ? 'is-complete' : ''].filter(Boolean).join(' ')}
              aria-label={`Буква ${index + 1} из ${positions.length}: ${value || 'пусто'}`}
              aria-pressed={index === cursor && !solved}
              onClick={() => focusPosition(index)}
            >
              <span>{value}</span>
              <small>{index + 1}</small>
            </button>
          );
        })}
      </div>
      <input
        ref={inputRef}
        className="fc-mobile-keyboard-input"
        type="text"
        inputMode="text"
        enterKeyHint="next"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-label={`Введите буквы для слова ${entry.number}`}
        onChange={onType}
        onKeyDown={onKeyDown}
      />
      <p className="fc-answer-help">Пересечения из уже разгаданных слов сохраняются.</p>
    </div>
  );
}
