import {
  type ChangeEvent,
  useCallback,
  useEffect,
  type KeyboardEvent,
  useRef,
  useState,
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
  compact?: boolean;
  cellSize?: number;
  recenterSignal?: number;
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
  compact = false,
  cellSize = 32,
  recenterSignal = 0,
}: Props) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastClickedCellRef = useRef<string | null>(null);
  const selectionByPointerRef = useRef(false);
  const gap = compact ? 3 : 2;
  const step = cellSize + gap;
  const panTo = useCallback((row: number, col: number, force = false) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const x = (col - BOUNDS.minCol) * step + 8;
    const y = (row - BOUNDS.minRow) * step + 8;
    if (force) {
      viewport.scrollTo({
        left: Math.max(0, x - viewport.clientWidth * 0.35),
        top: Math.max(0, y - viewport.clientHeight * 0.22),
        behavior: 'smooth',
      });
    } else {
      let left = viewport.scrollLeft, top = viewport.scrollTop;
      if (x < left + 24) left = Math.max(0, x - 24);
      else if (x + cellSize > left + viewport.clientWidth - 24)
        left = x + cellSize - viewport.clientWidth + 24;
      if (y < top + 24) top = Math.max(0, y - 24);
      else if (y + cellSize > top + viewport.clientHeight - 24)
        top = y + cellSize - viewport.clientHeight + 24;
      if (Math.abs(left - viewport.scrollLeft) > 1 || Math.abs(top - viewport.scrollTop) > 1)
        viewport.scrollTo({ left, top, behavior: 'smooth' });
    }
  }, [step, cellSize]);

  useEffect(() => {
    if (selectedEntryId === null) return;
    const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
    if (!entry) return;
    if (selectionByPointerRef.current) {
      selectionByPointerRef.current = false;
      return;
    }
    lastClickedCellRef.current = null;
    let target = { row: entry.row, col: entry.col };
    // When a word shares already-filled intersections, start at its first empty tile.
    while (userAnswers[cellKey(target.row, target.col)]) {
      const next = getNextCell(entry, target.row, target.col);
      if (!next) break;
      target = next;
    }
    setFocusedCell(target);
    setCurrentDirection(entry.direction);
    // Selecting a question must not unexpectedly summon the iOS keyboard.
    if (!compact) inputRefs.current.get(cellKey(target.row, target.col))?.focus({ preventScroll: true });
    panTo(target.row, target.col, true);
  }, [selectedEntryId, compact, panTo, recenterSignal]);

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
      const repeated = lastClickedCellRef.current === key;
      const nextDirection = repeated ? (currentDirection === 'across' ? 'down' : 'across') : currentDirection;
      const entry = getEntryForCell(row, col, nextDirection);
      if (entry) {
        if (entry.id !== selectedEntryId) selectionByPointerRef.current = true;
        onEntrySelect(entry.id);
        setCurrentDirection(entry.direction);
      }
      lastClickedCellRef.current = key;
      let target = { row, col };
      // Switching direction on a filled crossing should preserve that letter
      // and move to the next empty tile in the newly selected word.
      if (entry && userAnswers[key] && (repeated || entry.id !== selectedEntryId)) {
        let next = getNextCell(entry, row, col);
        while (next && userAnswers[cellKey(next.row, next.col)])
          next = getNextCell(entry, next.row, next.col);
        if (next) target = next;
      }
      setFocusedCell(target);
      inputRefs.current.get(cellKey(target.row, target.col))?.focus({ preventScroll: true });
      if (compact) panTo(target.row, target.col);
    },
    [currentDirection, onEntrySelect, selectedEntryId, compact, panTo, userAnswers]
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
            inputRefs.current.get(cellKey(prev.row, prev.col))?.focus({ preventScroll: true });
            if (compact) panTo(prev.row, prev.col);
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
          if (nextEntry) {
            // Keep the arrow-key target focused rather than jumping to word start.
            if (nextEntry.id !== selectedEntryId) selectionByPointerRef.current = true;
            onEntrySelect(nextEntry.id);
          }
          inputRefs.current.get(nextKey)?.focus({ preventScroll: true });
          if (compact) panTo(nextRow, nextCol);
        }
        return;
      }


    },
    [selectedEntryId, userAnswers, onCellChange, onEntrySelect, isCellLocked, compact, panTo]
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
            inputRefs.current.get(cellKey(next.row, next.col))?.focus({ preventScroll: true });
            if (compact) panTo(next.row, next.col);
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
        let next = getNextCell(entry, row, col);
        // Skip populated crossing tiles while entering a word. Those letters
        // remain editable by explicitly tapping the cell.
        while (next && (isCellLocked(next.row, next.col) || userAnswers[cellKey(next.row, next.col)]))
          next = getNextCell(entry, next.row, next.col);
        if (next) {
          setFocusedCell(next);
          inputRefs.current.get(cellKey(next.row, next.col))?.focus({ preventScroll: true });
          if (compact) panTo(next.row, next.col);
        }
      }
    },
    [selectedEntryId, onCellChange, isCellLocked, compact, panTo, userAnswers]
  );

  const gridWidthPx = DISPLAY_COLS * cellSize + (DISPLAY_COLS - 1) * gap;
  const gridHeightPx = DISPLAY_ROWS * cellSize + (DISPLAY_ROWS - 1) * gap;

  return (
    <div ref={viewportRef} className={`fc-grid-viewport ${compact ? 'is-compact' : ''}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="fc-grid-center">
        <div
          className="fc-grid-inner"
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
  const stateClass = isFocused ? 'is-focused'
    : isHighlighted ? 'is-highlighted'
    : isInvalid ? 'is-invalid'
    : isSolved ? 'is-solved'
    : isRevealed ? 'is-revealed'
    : userLetter ? 'is-filled' : '';

  const textClass = isFocused ? 'text-[#172322]' : isHighlighted ? 'text-[#172322]'
    : isSolved ? 'text-[#216652]' : 'text-[#172322]';

  const displayNumber =
    cell.isStart && cell.cellNumbers.length > 0 ? Math.min(...cell.cellNumbers) : null;
  const fontSize = cellSize < 28 ? 11 : cellSize < 36 ? 14 : 17;
  const numberFontSize = cellSize < 28 ? 7 : cellSize < 36 ? 9 : 10;

  return (
    <div
      style={{
        gridRow,
        gridColumn: gridCol,
        width: cellSize,
        height: cellSize,
        position: 'relative',
      }}
      className={`fc-cell ${stateClass}`}
      onClick={onCellClick}
    >
      {displayNumber !== null ? (
        <span
          className="fc-cell-number"
          style={{ fontSize: numberFontSize }}
        >
          {displayNumber}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        maxLength={2}
        inputMode="text"
        autoCapitalize="characters"
        enterKeyHint="next"
        value={userLetter}
        onChange={onInput}
        onKeyDown={onKeyDown}
        readOnly={isSolved}
        className={`absolute inset-0 opacity-0 w-full h-full ${isSolved ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label={`Клетка ${cell.row + 1}, столбец ${cell.col + 1}`}
        tabIndex={isFocused ? 0 : -1}
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
            className={`fc-cell-letter ${textClass}`}
            style={{ fontSize }}
          >
            {userLetter}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
