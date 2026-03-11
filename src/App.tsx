import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Keyboard } from 'lucide-react';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CrosswordGrid from './components/CrosswordGrid';
import CluesList from './components/CluesList';
import TheorySidebar from './components/TheorySidebar';
import VictoryModal from './components/VictoryModal';

import { CROSSWORD_ENTRIES } from './data/crosswordData';

// ============================================================
// Constants
// ============================================================
const STORAGE_KEY = 'fincross_progress_v4';
const cellKey = (r: number, c: number) => `${r},${c}`;

// ============================================================
// Types
// ============================================================
interface SavedState {
  userAnswers: Record<string, string>;
  revealedCells: string[];
}

// ============================================================
// Helpers: check which entries are fully solved
// ============================================================
function computeSolvedEntries(answers: Record<string, string>): Set<number> {
  const solved = new Set<number>();
  for (const entry of CROSSWORD_ENTRIES) {
    let allCorrect = true;
    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.direction === 'across' ? entry.row : entry.row + i;
      const c = entry.direction === 'across' ? entry.col + i : entry.col;
      const k = cellKey(r, c);
      if ((answers[k] || '').toUpperCase() !== entry.word[i].toUpperCase()) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) solved.add(entry.id);
  }
  return solved;
}

// ============================================================
// App Component
// ============================================================
export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(
    CROSSWORD_ENTRIES[0].id
  );
  const [showVictory, setShowVictory] = useState(false);
  const [hintUsed, setHintUsed] = useState(0);
  const [showCluesMobile, setShowCluesMobile] = useState(false);
  const [showTheoryMobile, setShowTheoryMobile] = useState(false);
  const [showKeyboardTip, setShowKeyboardTip] = useState(true);

  const solvedEntries = computeSolvedEntries(userAnswers);
  const prevSolvedRef = useRef<Set<number>>(new Set());

  // ── Load from localStorage ─────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        setUserAnswers(saved.userAnswers || {});
        setRevealedCells(new Set(saved.revealedCells || []));
      }
    } catch {
      // ignore corrupt data
    }
    // Hide keyboard tip after 5s
    const t = setTimeout(() => setShowKeyboardTip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // ── Save to localStorage on change ────────────────────────
  useEffect(() => {
    try {
      const state: SavedState = {
        userAnswers,
        revealedCells: Array.from(revealedCells),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [userAnswers, revealedCells]);

  // ── Check victory ─────────────────────────────────────────
  useEffect(() => {
    const prevSize = prevSolvedRef.current.size;
    const currSize = solvedEntries.size;
    prevSolvedRef.current = solvedEntries;

    if (currSize === CROSSWORD_ENTRIES.length && currSize > prevSize) {
      setTimeout(() => setShowVictory(true), 600);
    }
  }, [solvedEntries]);

  // ── Handle cell change ────────────────────────────────────
  const handleCellChange = useCallback((row: number, col: number, letter: string) => {
    const k = cellKey(row, col);
    setUserAnswers((prev) => {
      const next = { ...prev };
      if (letter) {
        next[k] = letter.toUpperCase();
      } else {
        delete next[k];
      }
      return next;
    });
  }, []);

  // ── Handle entry select ───────────────────────────────────
  const handleEntrySelect = useCallback((id: number | null) => {
    setSelectedEntryId(id);
  }, []);

  // ── Hint: reveal one letter in selected entry ─────────────
  const handleHint = useCallback(() => {
    if (!selectedEntryId) return;
    const entry = CROSSWORD_ENTRIES.find((e) => e.id === selectedEntryId);
    if (!entry) return;

    for (let i = 0; i < entry.word.length; i++) {
      const r = entry.direction === 'across' ? entry.row : entry.row + i;
      const c = entry.direction === 'across' ? entry.col + i : entry.col;
      const k = cellKey(r, c);
      const current = userAnswers[k] || '';
      if (current.toUpperCase() !== entry.word[i].toUpperCase()) {
        setUserAnswers((prev) => ({ ...prev, [k]: entry.word[i] }));
        setRevealedCells((prev) => new Set([...prev, k]));
        setHintUsed((h) => h + 1);
        return;
      }
    }
  }, [selectedEntryId, userAnswers]);

  // ── Reset ─────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setUserAnswers({});
    setRevealedCells(new Set());
    setShowVictory(false);
    setHintUsed(0);
    setSelectedEntryId(CROSSWORD_ENTRIES[0].id);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Selected entry data ───────────────────────────────────
  const selectedEntry = CROSSWORD_ENTRIES.find((e) => e.id === selectedEntryId);

  // ============================================================
  // Render
  // ============================================================
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          'radial-gradient(ellipse at 10% 0%, rgba(204,255,0,0.05) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 90% 80%, rgba(139,92,246,0.07) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.01) 0%, transparent 80%),' +
          '#0a0a0a',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <Header solvedCount={solvedEntries.size} onReset={handleReset} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Active Clue Bar ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedEntry && (
          <motion.div
            key={selectedEntry.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="sticky top-[53px] z-40 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/8 px-4 sm:px-6 py-2.5 flex items-center gap-3"
          >
            {/* Direction / Number badge */}
            <span className="flex-shrink-0 bg-[#ccff00] text-black text-xs font-black px-2 py-0.5 rounded-lg font-mono tracking-tight">
              {selectedEntry.number}
              {selectedEntry.direction === 'across' ? '→' : '↓'}
            </span>

            {/* Clue text */}
            <p className="flex-1 text-sm text-white/80 leading-snug line-clamp-1">
              {selectedEntry.clue}
            </p>

            {/* Letter count */}
            <span className="flex-shrink-0 hidden sm:block font-mono text-xs px-2 py-1 bg-white/5 rounded-lg text-white/30">
              {selectedEntry.word.length} букв
            </span>

            {/* Hint button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHint}
              title="Открыть следующую неверную букву"
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/50 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <Lightbulb size={12} />
              <span className="hidden sm:inline">Подсказка</span>
              {hintUsed > 0 && (
                <span className="bg-amber-500/30 text-amber-200 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-mono font-bold">
                  {hintUsed}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyboard tip toast ─────────────────────────────── */}
      <AnimatePresence>
        {showKeyboardTip && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 shadow-xl"
          >
            <Keyboard size={14} className="text-white/60" />
            <span className="text-xs text-white/60">
              Нажмите на клетку повторно — смените направление (→ / ↓)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Board ─────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-4 py-5 sm:py-6">

        {/* ── DESKTOP: 3-column bento ───────────────────────── */}
        <div className="hidden lg:grid gap-4 items-start"
          style={{ gridTemplateColumns: '270px 1fr 270px' }}
        >
          {/* LEFT — Theory */}
          <BentoCard
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 190px)', position: 'sticky', top: '110px' }}
          >
            <TheorySidebar
              solvedEntries={solvedEntries}
              selectedEntryId={selectedEntryId}
            />
          </BentoCard>

          {/* CENTER — Grid + Stats */}
          <div className="flex flex-col gap-4">
            <BentoCard>
              {/* Grid header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#ccff00]" />
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                    Кроссворд
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-white/30">
                  <span>{solvedEntries.size}</span>
                  <span className="text-white/15">/</span>
                  <span>{CROSSWORD_ENTRIES.length} слов</span>
                </div>
              </div>

              <CrosswordGrid
                userAnswers={userAnswers}
                solvedEntries={solvedEntries}
                onCellChange={handleCellChange}
                onEntrySelect={handleEntrySelect}
                selectedEntryId={selectedEntryId}
                revealedCells={revealedCells}
              />
            </BentoCard>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Разгадано" value={solvedEntries.size} color="#ccff00" />
              <StatCard
                label="Осталось"
                value={CROSSWORD_ENTRIES.length - solvedEntries.size}
                color="#8b5cf6"
              />
              <StatCard label="Подсказок" value={hintUsed} color="#f59e0b" />
            </div>
          </div>

          {/* RIGHT — Clues */}
          <BentoCard
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 190px)', position: 'sticky', top: '110px' }}
          >
            <CluesList
              selectedEntryId={selectedEntryId}
              solvedEntries={solvedEntries}
              onSelectEntry={handleEntrySelect}
            />
          </BentoCard>
        </div>

        {/* ── MOBILE layout ─────────────────────────────────── */}
        <div className="lg:hidden flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Разгадано" value={solvedEntries.size} color="#ccff00" />
            <StatCard
              label="Осталось"
              value={CROSSWORD_ENTRIES.length - solvedEntries.size}
              color="#8b5cf6"
            />
            <StatCard label="Подсказок" value={hintUsed} color="#f59e0b" />
          </div>

          {/* Grid */}
          <BentoCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#ccff00]" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                  Сетка кроссворда
                </span>
              </div>
            </div>
            <CrosswordGrid
              userAnswers={userAnswers}
              solvedEntries={solvedEntries}
              onCellChange={handleCellChange}
              onEntrySelect={handleEntrySelect}
              selectedEntryId={selectedEntryId}
              revealedCells={revealedCells}
            />
          </BentoCard>

          {/* Clues accordion */}
          <BentoCard>
            <button
              onClick={() => setShowCluesMobile((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#ccff00]" />
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">
                  Вопросы
                </span>
              </div>
              {showCluesMobile
                ? <ChevronUp size={16} className="text-white/30" />
                : <ChevronDown size={16} className="text-white/30" />}
            </button>
            <AnimatePresence>
              {showCluesMobile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <CluesList
                      selectedEntryId={selectedEntryId}
                      solvedEntries={solvedEntries}
                      onSelectEntry={(id) => {
                        handleEntrySelect(id);
                        setShowCluesMobile(false);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </BentoCard>

          {/* Theory accordion */}
          <BentoCard>
            <button
              onClick={() => setShowTheoryMobile((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-violet-400" />
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">
                  Теория
                </span>
                <span className="text-xs font-mono text-white/30 ml-1">
                  {solvedEntries.size}/{CROSSWORD_ENTRIES.length}
                </span>
              </div>
              {showTheoryMobile
                ? <ChevronUp size={16} className="text-white/30" />
                : <ChevronDown size={16} className="text-white/30" />}
            </button>
            <AnimatePresence>
              {showTheoryMobile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <TheorySidebar
                      solvedEntries={solvedEntries}
                      selectedEntryId={selectedEntryId}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </BentoCard>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-5 px-4 sm:px-6 mt-4">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-white/20 font-mono">
            FinCross · Финансовый кроссворд · 20 терминов
          </span>
          <span className="text-xs text-white/15 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Прогресс сохраняется в браузере
          </span>
        </div>
      </footer>

      {/* ── Victory Modal ───────────────────────────────────── */}
      <VictoryModal isVisible={showVictory} onReset={handleReset} />
    </div>
  );
}

// ============================================================
// BentoCard — glassmorphism card wrapper
// ============================================================
function BentoCard({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        bg-white/[0.035] backdrop-blur-md
        border border-white/8
        rounded-2xl p-4 sm:p-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)]
        ${className}
      `}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// StatCard — animated stat counter
// ============================================================
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center border"
      style={{
        background: `${color}08`,
        borderColor: `${color}18`,
      }}
    >
      <motion.div
        key={value}
        initial={{ scale: 1.5, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        className="text-2xl font-black font-mono tabular-nums leading-none mb-1"
        style={{ color }}
      >
        {value}
      </motion.div>
      <div className="text-[11px] text-white/35 font-medium tracking-wide">{label}</div>
    </div>
  );
}
