import {
  type ChangeEvent,
  useCallback,
  useEffect,
  type KeyboardEvent,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CROSSWORD_ENTRIES,
  buildGridMap,
  type CrosswordEntry,
  type GridCell,
} from '../data/crosswordData';

interface Props {
  userAnswers: Record<string, string>;
  solvedEntries: Set<number>;
  invalidCells: Set<string>;
  onCellChange: (row: number, col: number, letter: string) => void;
  onEntrySelect: (entryId: number | null) => void;
  selectedEntryId: number | null;
  revealedCells: Set<string>;
}

const cellKey = (row: number, col: number) => `${row},${col}`;
const GRID_MAP = buildGridMap(CROSSWORD_ENTRIES);

function getGridBounds() {
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  GRID_MAP.forEach((cell) => {
    if (cell.row < minRow) minRow = cell.row;
    if (cell.row > maxRow) maxRow = cell.row;
    if (cell.col < minCol) minCol = cell.col;
    if (cell.col > maxCol) maxCol = cell.col;
  });

  return { minRow, maxRow, minCol, maxCol };
}

const BOUNDS = getGridBounds();
const DISPLAY_ROWS = BOUNDS.maxRow - BOUNDS.minRow + 1;
const DISPLAY_COLS = BOUNDS.maxCol - BOUNDS.minCol + 1;

function getEntryForCell(
  row: number,
  col: number,
  preferDirection: 'across' | 'down'
): CrosswordEntry | null {
  const cell = GRID_MAP.get(cellKey(row, col));
  if (!cell) return null;

  const entries = CROSSWORD_ENTRIES.filter((entry) => cell.entryIds.includes(entry.id));
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0];

  return entries.find((entry) => entry.direction === preferDirection) || entries[0];
}

function getNextCell(
  entry: CrosswordEntry,
  currentRow: number,
  currentCol: number
): { row: number; col: number } | null {
  const index =
    entry.direction === 'across' ? currentCol - entry.col : currentRow - entry.row;
  const nextIndex = index + 1;

  if (nextIndex >= entry.word.length) return null;

  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + nextIndex }
    : { row: entry.row + nextIndex, col: entry.col };
}

function getPrevCell(
  entry: CrosswordEntry,
  currentRow: number,
  currentCol: number
): { row: number; col: number } | null {
  const index =
    entry.direction === 'across' ? currentCol - entry.col : currentRow - entry.row;
  const prevIndex = index - 1;

  if (prevIndex < 0) return null;

  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + prevIndex }
    : { row: entry.row + prevIndex, col: entry.col };
}

export default function CrosswordGrid({
  userAnswers,
  solvedEntries,
  invalidCells,
  onCellChange,
  onEntrySelect,
  selectedEntryId,
  revealedCells,
}: Props) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (selectedEntryId === null) return;
    const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
    if (!entry) return;

    setFocusedCell({ row: entry.row, col: entry.col });
    setCurrentDirection(entry.direction);
    inputRefs.current.get(cellKey(entry.row, entry.col))?.focus();
  }, [selectedEntryId]);

  const highlightedCells = new Set<string>();
  if (selectedEntryId !== null) {
    const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
    if (entry) {
      for (let index = 0; index < entry.word.length; index++) {
        const row = entry.direction === 'across' ? entry.row : entry.row + index;
        const col = entry.direction === 'across' ? entry.col + index : entry.col;
        highlightedCells.add(cellKey(row, col));
      }
    }
  }

  const solvedCells = new Set<string>();
  for (const id of solvedEntries) {
    const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === id);
    if (!entry) continue;

    for (let index = 0; index < entry.word.length; index++) {
      const row = entry.direction === 'across' ? entry.row : entry.row + index;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      solvedCells.add(cellKey(row, col));
    }
  }

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const key = cellKey(row, col);
      if (!GRID_MAP.has(key)) return;

      if (focusedCell?.row === row && focusedCell?.col === col) {
        const nextDirection = currentDirection === 'across' ? 'down' : 'across';
        setCurrentDirection(nextDirection);
        const entry = getEntryForCell(row, col, nextDirection);
        if (entry) {
          onEntrySelect(entry.id);
          setCurrentDirection(entry.direction);
        }
      } else {
        setFocusedCell({ row, col });
        const entry = getEntryForCell(row, col, currentDirection);
        if (entry) {
          onEntrySelect(entry.id);
          setCurrentDirection(entry.direction);
        }
      }

      inputRefs.current.get(key)?.focus();
    },
    [focusedCell, currentDirection, onEntrySelect]
  );

  const isCellLocked = useCallback(
    (row: number, col: number) => solvedCells.has(cellKey(row, col)),
    [solvedCells]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (isCellLocked(row, col)) return;

        const key = cellKey(row, col);
        const currentValue = userAnswers[key] || '';
        if (currentValue) {
          onCellChange(row, col, '');
        } else if (entry) {
          const prev = getPrevCell(entry, row, col);
          if (prev) {
            setFocusedCell(prev);
            if (!isCellLocked(prev.row, prev.col)) {
              onCellChange(prev.row, prev.col, '');
            }
            inputRefs.current.get(cellKey(prev.row, prev.col))?.focus();
          }
        }
        return;
      }

      if (event.key === 'Delete') {
        event.preventDefault();
        if (isCellLocked(row, col)) return;
        onCellChange(row, col, '');
        return;
      }

      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();

        let nextRow = row;
        let nextCol = col;
        if (event.key === 'ArrowRight') nextCol++;
        if (event.key === 'ArrowLeft') nextCol--;
        if (event.key === 'ArrowDown') nextRow++;
        if (event.key === 'ArrowUp') nextRow--;

        const nextKey = cellKey(nextRow, nextCol);
        if (GRID_MAP.has(nextKey)) {
          setFocusedCell({ row: nextRow, col: nextCol });
          const nextDirection =
            event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? 'across' : 'down';
          setCurrentDirection(nextDirection);
          const nextEntry = getEntryForCell(nextRow, nextCol, nextDirection);
          if (nextEntry) onEntrySelect(nextEntry.id);
          inputRefs.current.get(nextKey)?.focus();
        }
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = CROSSWORD_ENTRIES.findIndex((candidate) => candidate.id === selectedEntryId);
        const nextIndex = event.shiftKey
          ? (currentIndex - 1 + CROSSWORD_ENTRIES.length) % CROSSWORD_ENTRIES.length
          : (currentIndex + 1) % CROSSWORD_ENTRIES.length;
        const nextEntry = CROSSWORD_ENTRIES[nextIndex];

        if (nextEntry) {
          onEntrySelect(nextEntry.id);
          setCurrentDirection(nextEntry.direction);
          setFocusedCell({ row: nextEntry.row, col: nextEntry.col });
          inputRefs.current.get(cellKey(nextEntry.row, nextEntry.col))?.focus();
        }
      }
    },
    [selectedEntryId, userAnswers, onCellChange, onEntrySelect, isCellLocked]
  );

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      if (isCellLocked(row, col)) {
        event.preventDefault();
        const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
        if (entry) {
          const next = getNextCell(entry, row, col);
          if (next) {
            setFocusedCell(next);
            inputRefs.current.get(cellKey(next.row, next.col))?.focus();
          }
        }
        return;
      }

      const raw = event.target.value.toUpperCase().replace(/[^А-ЯЁA-Z]/g, '');
      if (!raw) return;

      const char = raw[raw.length - 1];
      onCellChange(row, col, char);

      const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
      if (entry) {
        const next = getNextCell(entry, row, col);
        if (next) {
          setFocusedCell(next);
          inputRefs.current.get(cellKey(next.row, next.col))?.focus();
        }
      }
    },
    [selectedEntryId, onCellChange, isCellLocked]
  );

  const cellSize = 32;
  const gap = 2;
  const gridWidthPx = DISPLAY_COLS * cellSize + (DISPLAY_COLS - 1) * gap;
  const gridHeightPx = DISPLAY_ROWS * cellSize + (DISPLAY_ROWS - 1) * gap;

  return (
    <div className="w-full overflow-auto rounded-xl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex justify-center min-w-fit p-2">
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${DISPLAY_ROWS}, ${cellSize}px)`,
            gridTemplateColumns: `repeat(${DISPLAY_COLS}, ${cellSize}px)`,
            gap: `${gap}px`,
            width: `${gridWidthPx}px`,
            height: `${gridHeightPx}px`,
          }}
        >
          {Array.from({ length: DISPLAY_ROWS }, (_, rowIndex) =>
            Array.from({ length: DISPLAY_COLS }, (_, colIndex) => {
              const row = rowIndex + BOUNDS.minRow;
              const col = colIndex + BOUNDS.minCol;
              const key = cellKey(row, col);
              const cell = GRID_MAP.get(key);

              if (!cell) {
                return <div key={key} style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }} />;
              }

              return (
                <CellTile
                  key={key}
                  gridRow={rowIndex + 1}
                  gridCol={colIndex + 1}
                  cell={cell}
                  userLetter={userAnswers[key] || ''}
                  isFocused={focusedCell?.row === row && focusedCell?.col === col}
                  isHighlighted={highlightedCells.has(key)}
                  isSolved={solvedCells.has(key)}
                  isRevealed={revealedCells.has(key)}
                  isInvalid={invalidCells.has(key)}
                  onCellClick={() => handleCellClick(row, col)}
                  onKeyDown={(event) => handleKeyDown(event, row, col)}
                  onInput={(event) => handleInput(event, row, col)}
                  inputRef={(element) => {
                    if (element) inputRefs.current.set(key, element);
                    else inputRefs.current.delete(key);
                  }}
                  cellSize={cellSize}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface CellTileProps {
  gridRow: number;
  gridCol: number;
  cell: GridCell;
  userLetter: string;
  isFocused: boolean;
  isHighlighted: boolean;
  isSolved: boolean;
  isRevealed: boolean;
  isInvalid: boolean;
  onCellClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInput: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: (element: HTMLInputElement | null) => void;
  cellSize: number;
}

function CellTile({
  gridRow,
  gridCol,
  cell,
  userLetter,
  isFocused,
  isHighlighted,
  isSolved,
  isRevealed,
  isInvalid,
  onCellClick,
  onKeyDown,
  onInput,
  inputRef,
  cellSize,
}: CellTileProps) {
  let bgClass = 'bg-white/[0.07]';
  let borderClass = 'border border-white/[0.12]';
  let textClass = 'text-white';
  let glowStyle: CSSProperties = {};

  if (isFocused) {
    bgClass = 'bg-[#ccff00]/25';
    borderClass = 'border-2 border-[#ccff00]';
    glowStyle = { boxShadow: '0 0 14px rgba(204,255,0,0.5), inset 0 0 6px rgba(204,255,0,0.15)' };
    textClass = 'text-[#ccff00]';
  } else if (isHighlighted) {
    bgClass = 'bg-[#ccff00]/10';
    borderClass = 'border border-[#ccff00]/30';
    textClass = 'text-[#ccff00]';
  } else if (isSolved) {
    bgClass = 'bg-emerald-500/15';
    borderClass = 'border border-emerald-500/30';
    textClass = 'text-emerald-400';
    glowStyle = { boxShadow: 'inset 0 0 4px rgba(16,185,129,0.1)' };
  } else if (isRevealed) {
    bgClass = 'bg-violet-500/15';
    borderClass = 'border border-violet-500/30';
    textClass = 'text-violet-300';
  } else if (isInvalid) {
    bgClass = 'bg-rose-500/14';
    borderClass = 'border border-rose-400/35';
    textClass = 'text-rose-300';
    glowStyle = { boxShadow: '0 0 10px rgba(244,63,94,0.18)' };
  } else if (userLetter) {
    bgClass = 'bg-white/10';
    borderClass = 'border border-white/20';
  }

  const displayNumber =
    cell.isStart && cell.cellNumbers.length > 0 ? Math.min(...cell.cellNumbers) : null;
  const fontSize = cellSize < 28 ? 11 : cellSize < 36 ? 14 : 17;
  const numberFontSize = cellSize < 28 ? 6 : cellSize < 36 ? 8 : 9;

  return (
    <div
      style={{
        gridRow,
        gridColumn: gridCol,
        width: cellSize,
        height: cellSize,
        position: 'relative',
        ...glowStyle,
      }}
      className={`
        relative rounded-[4px] cursor-pointer select-none transition-all duration-150
        ${bgClass} ${borderClass}
        flex items-center justify-center
      `}
      onClick={onCellClick}
    >
      {displayNumber !== null ? (
        <span
          className="absolute top-[1px] left-[2px] text-white/50 leading-none font-mono font-bold"
          style={{ fontSize: numberFontSize }}
        >
          {displayNumber}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        maxLength={2}
        value={userLetter}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onFocus={onCellClick}
        readOnly={isSolved}
        className={`absolute inset-0 opacity-0 w-full h-full ${isSolved ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label={`Cell ${cell.row},${cell.col}`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <AnimatePresence mode="wait">
        {userLetter ? (
          <motion.span
            key={userLetter}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={`font-bold uppercase select-none pointer-events-none ${textClass}`}
            style={{ fontSize }}
          >
            {userLetter}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
