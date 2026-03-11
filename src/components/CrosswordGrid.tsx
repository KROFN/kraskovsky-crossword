import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CROSSWORD_ENTRIES,
  buildGridMap,
  type CrosswordEntry,
  type GridCell,
} from '../data/crosswordData';

// ============================================================
// Types
// ============================================================
interface Props {
  userAnswers: Record<string, string>;       // key: "row,col" → letter
  solvedEntries: Set<number>;
  onCellChange: (row: number, col: number, letter: string) => void;
  onEntrySelect: (entryId: number | null) => void;
  selectedEntryId: number | null;
  revealedCells: Set<string>;               // cells revealed via hint
}

// ============================================================
// Helpers
// ============================================================
const cellKey = (r: number, c: number) => `${r},${c}`;

const GRID_MAP = buildGridMap(CROSSWORD_ENTRIES);

/** Compute bounding box of all active cells for tight rendering */
function getGridBounds() {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  GRID_MAP.forEach((cell) => {
    if (cell.row < minR) minR = cell.row;
    if (cell.row > maxR) maxR = cell.row;
    if (cell.col < minC) minC = cell.col;
    if (cell.col > maxC) maxC = cell.col;
  });
  return { minR, maxR, minC, maxC };
}

const BOUNDS = getGridBounds();
const DISPLAY_ROWS = BOUNDS.maxR - BOUNDS.minR + 1;
const DISPLAY_COLS = BOUNDS.maxC - BOUNDS.minC + 1;

/** Find the best matching entry for a cell given a preferred direction */
function getEntryForCell(
  row: number,
  col: number,
  preferDirection: 'across' | 'down'
): CrosswordEntry | null {
  const k = cellKey(row, col);
  const cell = GRID_MAP.get(k);
  if (!cell) return null;

  const entries = CROSSWORD_ENTRIES.filter((e) => cell.entryIds.includes(e.id));
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0];

  return entries.find((e) => e.direction === preferDirection) || entries[0];
}

/** Next cell in the word after current position */
function getNextCell(
  entry: CrosswordEntry,
  currentRow: number,
  currentCol: number
): { row: number; col: number } | null {
  const idx =
    entry.direction === 'across'
      ? currentCol - entry.col
      : currentRow - entry.row;
  const nextIdx = idx + 1;
  if (nextIdx >= entry.word.length) return null;
  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + nextIdx }
    : { row: entry.row + nextIdx, col: entry.col };
}

function getPrevCell(
  entry: CrosswordEntry,
  currentRow: number,
  currentCol: number
): { row: number; col: number } | null {
  const idx =
    entry.direction === 'across'
      ? currentCol - entry.col
      : currentRow - entry.row;
  const prevIdx = idx - 1;
  if (prevIdx < 0) return null;
  return entry.direction === 'across'
    ? { row: entry.row, col: entry.col + prevIdx }
    : { row: entry.row + prevIdx, col: entry.col };
}

// ============================================================
// CrosswordGrid Component
// ============================================================
export default function CrosswordGrid({
  userAnswers,
  solvedEntries,
  onCellChange,
  onEntrySelect,
  selectedEntryId,
  revealedCells,
}: Props) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Sync external selectedEntryId → focus first cell of that entry
  useEffect(() => {
    if (selectedEntryId === null) return;
    const entry = CROSSWORD_ENTRIES.find((e) => e.id === selectedEntryId);
    if (!entry) return;
    setFocusedCell({ row: entry.row, col: entry.col });
    setCurrentDirection(entry.direction);
    const ref = inputRefs.current.get(cellKey(entry.row, entry.col));
    ref?.focus();
  }, [selectedEntryId]);

  // Highlight cells belonging to the selected entry
  const highlightedCells = new Set<string>();
  if (selectedEntryId !== null) {
    const entry = CROSSWORD_ENTRIES.find((e) => e.id === selectedEntryId);
    if (entry) {
      for (let i = 0; i < entry.word.length; i++) {
        const r = entry.direction === 'across' ? entry.row : entry.row + i;
        const c = entry.direction === 'across' ? entry.col + i : entry.col;
        highlightedCells.add(cellKey(r, c));
      }
    }
  }

  // Cells belonging to solved entries
  const solvedCells = new Set<string>();
  for (const id of solvedEntries) {
    const entry = CROSSWORD_ENTRIES.find((e) => e.id === id);
    if (!entry) continue;
    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.direction === 'across' ? entry.row : entry.row + i;
      const c = entry.direction === 'across' ? entry.col + i : entry.col;
      solvedCells.add(cellKey(r, c));
    }
  }

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const k = cellKey(row, col);
      const cell = GRID_MAP.get(k);
      if (!cell) return;

      // If clicking the same cell, toggle direction
      if (focusedCell?.row === row && focusedCell?.col === col) {
        const newDir = currentDirection === 'across' ? 'down' : 'across';
        setCurrentDirection(newDir);
        const entry = getEntryForCell(row, col, newDir);
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

      inputRefs.current.get(k)?.focus();
    },
    [focusedCell, currentDirection, onEntrySelect]
  );

  // Check if a specific cell is locked (belongs to any solved entry)
  const isCellLocked = useCallback(
    (row: number, col: number): boolean => {
      return solvedCells.has(cellKey(row, col));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solvedEntries]
  );

  // Handle key input in a cell
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      const entry = CROSSWORD_ENTRIES.find((en) => en.id === selectedEntryId);

      if (e.key === 'Backspace') {
        e.preventDefault();
        // Don't allow deleting from locked (solved) cells
        if (isCellLocked(row, col)) return;
        const k = cellKey(row, col);
        const currentVal = userAnswers[k] || '';
        if (currentVal) {
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

      if (e.key === 'Delete') {
        e.preventDefault();
        if (isCellLocked(row, col)) return;
        onCellChange(row, col, '');
        return;
      }

      // Arrow key navigation
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        let targetR = row, targetC = col;
        if (e.key === 'ArrowRight') targetC++;
        if (e.key === 'ArrowLeft') targetC--;
        if (e.key === 'ArrowDown') targetR++;
        if (e.key === 'ArrowUp') targetR--;
        const targetKey = cellKey(targetR, targetC);
        if (GRID_MAP.has(targetKey)) {
          setFocusedCell({ row: targetR, col: targetC });
          const newDir =
            e.key === 'ArrowRight' || e.key === 'ArrowLeft' ? 'across' : 'down';
          setCurrentDirection(newDir);
          const newEntry = getEntryForCell(targetR, targetC, newDir);
          if (newEntry) onEntrySelect(newEntry.id);
          inputRefs.current.get(targetKey)?.focus();
        }
        return;
      }

      // Tab navigation between entries
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIdx = CROSSWORD_ENTRIES.findIndex((en) => en.id === selectedEntryId);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + CROSSWORD_ENTRIES.length) % CROSSWORD_ENTRIES.length
          : (currentIdx + 1) % CROSSWORD_ENTRIES.length;
        const nextEntry = CROSSWORD_ENTRIES[nextIdx];
        if (nextEntry) {
          onEntrySelect(nextEntry.id);
          setCurrentDirection(nextEntry.direction);
          setFocusedCell({ row: nextEntry.row, col: nextEntry.col });
          inputRefs.current.get(cellKey(nextEntry.row, nextEntry.col))?.focus();
        }
        return;
      }
    },
    [selectedEntryId, userAnswers, onCellChange, onEntrySelect]
  );

  // Handle actual character input
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      // Don't allow typing in locked (solved) cells
      if (isCellLocked(row, col)) {
        e.preventDefault();
        // Still advance to next cell so user can skip through solved letters
        const entry = CROSSWORD_ENTRIES.find((en) => en.id === selectedEntryId);
        if (entry) {
          const next = getNextCell(entry, row, col);
          if (next) {
            setFocusedCell(next);
            inputRefs.current.get(cellKey(next.row, next.col))?.focus();
          }
        }
        return;
      }

      const raw = e.target.value.toUpperCase().replace(/[^А-ЯЁA-Z]/g, '');
      if (!raw) return;
      const char = raw[raw.length - 1];

      onCellChange(row, col, char);

      // Advance to next cell
      const entry = CROSSWORD_ENTRIES.find((en) => en.id === selectedEntryId);
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

  // ── Render ──────────────────────────────────────────────────
  // Cell size: we use fixed pixel sizes for consistency
  const CELL_SIZE = 32; // px per cell
  const GAP = 2;        // px gap between cells
  const gridWidthPx = DISPLAY_COLS * CELL_SIZE + (DISPLAY_COLS - 1) * GAP;
  const gridHeightPx = DISPLAY_ROWS * CELL_SIZE + (DISPLAY_ROWS - 1) * GAP;

  return (
    <div className="w-full overflow-auto rounded-xl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex justify-center min-w-fit p-2">
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${DISPLAY_ROWS}, ${CELL_SIZE}px)`,
            gridTemplateColumns: `repeat(${DISPLAY_COLS}, ${CELL_SIZE}px)`,
            gap: `${GAP}px`,
            width: `${gridWidthPx}px`,
            height: `${gridHeightPx}px`,
          }}
        >
          {Array.from({ length: DISPLAY_ROWS }, (_, ri) =>
            Array.from({ length: DISPLAY_COLS }, (_, ci) => {
              const r = ri + BOUNDS.minR;
              const c = ci + BOUNDS.minC;
              const k = cellKey(r, c);
              const cell: GridCell | undefined = GRID_MAP.get(k);

              if (!cell) {
                // Empty / void cell — transparent
                return (
                  <div
                    key={k}
                    style={{ gridRow: ri + 1, gridColumn: ci + 1 }}
                  />
                );
              }

              const isFocused = focusedCell?.row === r && focusedCell?.col === c;
              const isHighlighted = highlightedCells.has(k);
              const isSolved = solvedCells.has(k);
              const isRevealed = revealedCells.has(k);
              const userLetter = userAnswers[k] || '';

              return (
                <CellTile
                  key={k}
                  gridRow={ri + 1}
                  gridCol={ci + 1}
                  cell={cell}
                  userLetter={userLetter}
                  isFocused={isFocused}
                  isHighlighted={isHighlighted}
                  isSolved={isSolved}
                  isRevealed={isRevealed}
                  onCellClick={() => handleCellClick(r, c)}
                  onKeyDown={(e) => handleKeyDown(e, r, c)}
                  onInput={(e) => handleInput(e, r, c)}
                  inputRef={(el) => {
                    if (el) inputRefs.current.set(k, el);
                    else inputRefs.current.delete(k);
                  }}
                  cellSize={CELL_SIZE}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Single Cell Tile
// ============================================================
interface CellTileProps {
  gridRow: number;
  gridCol: number;
  cell: GridCell;
  userLetter: string;
  isFocused: boolean;
  isHighlighted: boolean;
  isSolved: boolean;
  isRevealed: boolean;
  onCellClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
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
  onCellClick,
  onKeyDown,
  onInput,
  inputRef,
  cellSize,
}: CellTileProps) {
  // Background & border logic
  let bgClass = 'bg-white/[0.07]';
  let borderClass = 'border border-white/[0.12]';
  let textClass = 'text-white';
  let glowStyle: React.CSSProperties = {};

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
  } else if (userLetter) {
    bgClass = 'bg-white/10';
    borderClass = 'border border-white/20';
  }

  // Number label (smallest number if multiple)
  const displayNumber = cell.isStart && cell.cellNumbers.length > 0
    ? Math.min(...cell.cellNumbers)
    : null;

  // Font size scales with cell
  const fontSize = cellSize < 28 ? 11 : cellSize < 36 ? 14 : 17;
  const numFontSize = cellSize < 28 ? 6 : cellSize < 36 ? 8 : 9;

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
      {/* Cell number */}
      {displayNumber !== null && (
        <span
          className="absolute top-[1px] left-[2px] text-white/50 leading-none font-mono font-bold"
          style={{ fontSize: numFontSize }}
        >
          {displayNumber}
        </span>
      )}

      {/* Hidden input for keyboard capture */}
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

      {/* Displayed letter with animation */}
      <AnimatePresence mode="wait">
        {userLetter && (
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
        )}
      </AnimatePresence>
    </div>
  );
}
