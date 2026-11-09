import { CROSSWORD_ENTRIES, buildGridMap } from '../data/crosswordData';

const grid = buildGridMap(CROSSWORD_ENTRIES);
const cells = [...grid.values()];
const minR = Math.min(...cells.map(c => c.row));
const maxR = Math.max(...cells.map(c => c.row));
const minC = Math.min(...cells.map(c => c.col));
const maxC = Math.max(...cells.map(c => c.col));
const key = (r: number, c: number) => `${r},${c}`;

export default function GridOverview({ selectedEntryId, solvedEntries, answers }: {
  selectedEntryId: number | null;
  solvedEntries: Set<number>;
  answers: Record<string, string>;
}) {
  const selected = CROSSWORD_ENTRIES.find(e => e.id === selectedEntryId);
  const active = new Set<string>();
  const solved = new Set<string>();
  if (selected) for (let i = 0; i < selected.word.length; i++) {
    active.add(key(selected.row + (selected.direction === 'down' ? i : 0),
      selected.col + (selected.direction === 'across' ? i : 0)));
  }
  for (const e of CROSSWORD_ENTRIES) if (solvedEntries.has(e.id)) {
    for (let i = 0; i < e.word.length; i++)
      solved.add(key(e.row + (e.direction === 'down' ? i : 0),
        e.col + (e.direction === 'across' ? i : 0)));
  }
  const count = maxC - minC + 1;
  return (
    <div className="fc-overview-map" role="img" aria-label="Общая карта кроссворда: активное слово выделено синим">
      <div className="fc-overview-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: (maxR - minR + 1) * count }, (_, index) => {
          const row = minR + Math.floor(index / count);
          const col = minC + index % count;
          const k = key(row, col);
          const cell = grid.get(k);
          return <span key={k} className={['fc-overview-cell', cell ? 'is-cell' : '',
            active.has(k) ? 'is-active' : '', solved.has(k) ? 'is-solved' : '',
            answers[k] ? 'is-filled' : ''].filter(Boolean).join(' ')} />;
        })}
      </div>
    </div>
  );
}
