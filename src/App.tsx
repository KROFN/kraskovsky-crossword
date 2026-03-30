import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Keyboard, ShieldCheck } from 'lucide-react';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import CrosswordGrid from './components/CrosswordGrid';
import CluesList from './components/CluesList';
import TheorySidebar from './components/TheorySidebar';
import VictoryModal from './components/VictoryModal';

import { CROSSWORD_ENTRIES } from './data/crosswordData';

const STORAGE_KEY = 'fincross_progress_v5';
const cellKey = (r: number, c: number) => `${r},${c}`;

interface SavedState {
  userAnswers: Record<string, string>;
  revealedCells: string[];
  selectedEntryId: number | null;
  hintUsed: number;
  checkCount: number;
  elapsedSeconds: number;
  hasStarted: boolean;
}

interface CheckFeedback {
  tone: 'neutral' | 'success' | 'error';
  message: string;
}

const SOLUTION_MAP = new Map<string, string>();
for (const entry of CROSSWORD_ENTRIES) {
  for (let i = 0; i < entry.word.length; i++) {
    const row = entry.direction === 'across' ? entry.row : entry.row + i;
    const col = entry.direction === 'across' ? entry.col + i : entry.col;
    SOLUTION_MAP.set(cellKey(row, col), entry.word[i].toUpperCase());
  }
}

function computeSolvedEntries(answers: Record<string, string>): Set<number> {
  const solved = new Set<number>();
  for (const entry of CROSSWORD_ENTRIES) {
    let allCorrect = true;
    for (let i = 0; i < entry.word.length; i++) {
      const row = entry.direction === 'across' ? entry.row : entry.row + i;
      const col = entry.direction === 'across' ? entry.col + i : entry.col;
      if ((answers[cellKey(row, col)] || '').toUpperCase() !== entry.word[i].toUpperCase()) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) solved.add(entry.id);
  }
  return solved;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function App() {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(CROSSWORD_ENTRIES[0].id);
  const [showVictory, setShowVictory] = useState(false);
  const [hintUsed, setHintUsed] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<CheckFeedback | null>(null);
  const [showCluesMobile, setShowCluesMobile] = useState(false);
  const [showTheoryMobile, setShowTheoryMobile] = useState(false);
  const [showKeyboardTip, setShowKeyboardTip] = useState(true);

  const solvedEntries = computeSolvedEntries(userAnswers);
  const prevSolvedRef = useRef<Set<number>>(new Set());

  let filledCells = 0;
  let correctCells = 0;
  for (const [key, expected] of SOLUTION_MAP) {
    const actual = (userAnswers[key] || '').toUpperCase();
    if (!actual) continue;
    filledCells++;
    if (actual === expected) correctCells++;
  }

  const wrongFilledCells = filledCells - correctCells;
  const accuracy = filledCells === 0 ? 100 : Math.round((correctCells / filledCells) * 100);
  const score = Math.max(
    0,
    solvedEntries.size * 150 +
      correctCells * 5 +
      Math.max(0, 1200 - elapsedSeconds) -
      hintUsed * 40 -
      checkCount * 10 -
      wrongFilledCells * 5
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        setUserAnswers(saved.userAnswers || {});
        setRevealedCells(new Set(saved.revealedCells || []));
        setSelectedEntryId(saved.selectedEntryId ?? CROSSWORD_ENTRIES[0].id);
        setHintUsed(saved.hintUsed || 0);
        setCheckCount(saved.checkCount || 0);
        setElapsedSeconds(saved.elapsedSeconds || 0);
        setHasStarted(Boolean(saved.hasStarted));
      }
    } catch {
      // Ignore corrupt local state.
    }

    const timeoutId = window.setTimeout(() => setShowKeyboardTip(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    try {
      const state: SavedState = {
        userAnswers,
        revealedCells: Array.from(revealedCells),
        selectedEntryId,
        hintUsed,
        checkCount,
        elapsedSeconds,
        hasStarted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures.
    }
  }, [userAnswers, revealedCells, selectedEntryId, hintUsed, checkCount, elapsedSeconds, hasStarted]);

  useEffect(() => {
    if (!hasStarted || showVictory) return;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [hasStarted, showVictory]);

  useEffect(() => {
    const prevSize = prevSolvedRef.current.size;
    const currSize = solvedEntries.size;
    prevSolvedRef.current = solvedEntries;

    if (currSize === CROSSWORD_ENTRIES.length && currSize > prevSize) {
      setInvalidCells(new Set());
      setCheckFeedback({
        tone: 'success',
        message: 'Кроссворд собран без ошибок. Финальный экран уже открыт.',
      });
      window.setTimeout(() => setShowVictory(true), 600);
    }
  }, [solvedEntries]);

  const handleCellChange = useCallback((row: number, col: number, letter: string) => {
    const key = cellKey(row, col);
    if (letter) setHasStarted(true);

    setUserAnswers((prev) => {
      const next = { ...prev };
      if (letter) {
        next[key] = letter.toUpperCase();
      } else {
        delete next[key];
      }
      return next;
    });

    setInvalidCells((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleEntrySelect = useCallback((id: number | null) => {
    setSelectedEntryId(id);
  }, []);

  const handleHint = useCallback(() => {
    if (!selectedEntryId) return;
    const entry = CROSSWORD_ENTRIES.find((candidate) => candidate.id === selectedEntryId);
    if (!entry) return;

    for (let i = 0; i < entry.word.length; i++) {
      const row = entry.direction === 'across' ? entry.row : entry.row + i;
      const col = entry.direction === 'across' ? entry.col + i : entry.col;
      const key = cellKey(row, col);
      const current = (userAnswers[key] || '').toUpperCase();
      const expected = entry.word[i].toUpperCase();

      if (current !== expected) {
        setHasStarted(true);
        setUserAnswers((prev) => ({ ...prev, [key]: expected }));
        setRevealedCells((prev) => new Set([...prev, key]));
        setInvalidCells((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setHintUsed((value) => value + 1);
        setCheckFeedback({
          tone: 'neutral',
          message: 'Подсказка открыла следующую неверную букву в активном слове.',
        });
        return;
      }
    }

    setCheckFeedback({
      tone: 'neutral',
      message: 'Активное слово уже собрано. Выберите другое и продолжайте.',
    });
  }, [selectedEntryId, userAnswers]);

  const handleCheck = useCallback(() => {
    if (filledCells === 0) {
      setCheckFeedback({
        tone: 'neutral',
        message: 'Сначала заполните хотя бы несколько клеток, потом проверим ответы.',
      });
      return;
    }

    setHasStarted(true);

    const wrong = new Set<string>();
    for (const [key, expected] of SOLUTION_MAP) {
      const actual = (userAnswers[key] || '').toUpperCase();
      if (actual && actual !== expected) {
        wrong.add(key);
      }
    }

    setCheckCount((value) => value + 1);
    setInvalidCells(wrong);

    if (wrong.size > 0) {
      setCheckFeedback({
        tone: 'error',
        message: `Нашли ${wrong.size} ${pluralize(wrong.size, 'ошибку', 'ошибки', 'ошибок')}. Неверные клетки подсвечены на поле.`,
      });
      return;
    }

    if (solvedEntries.size === CROSSWORD_ENTRIES.length) {
      setCheckFeedback({
        tone: 'success',
        message: 'Все ответы верны. Кроссворд завершен на 100%.',
      });
      return;
    }

    setCheckFeedback({
      tone: 'success',
      message: 'Ошибок нет. Можно спокойно продолжать и добирать оставшиеся слова.',
    });
  }, [filledCells, solvedEntries.size, userAnswers]);

  const handleReset = useCallback(() => {
    setUserAnswers({});
    setRevealedCells(new Set());
    setInvalidCells(new Set());
    setShowVictory(false);
    setHintUsed(0);
    setCheckCount(0);
    setElapsedSeconds(0);
    setHasStarted(false);
    setCheckFeedback(null);
    setSelectedEntryId(CROSSWORD_ENTRIES[0].id);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selectedEntry = CROSSWORD_ENTRIES.find((entry) => entry.id === selectedEntryId);
  const feedbackToneStyles: Record<CheckFeedback['tone'], string> = {
    neutral: 'bg-white/6 border-white/10 text-white/65',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  };

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
      <Header
        solvedCount={solvedEntries.size}
        score={score}
        elapsedLabel={formatElapsed(elapsedSeconds)}
        onReset={handleReset}
      />

      <HeroSection />

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
            <span className="flex-shrink-0 bg-[#ccff00] text-black text-xs font-black px-2 py-0.5 rounded-lg font-mono tracking-tight">
              {selectedEntry.number}
              {selectedEntry.direction === 'across' ? '→' : '↓'}
            </span>

            <p className="flex-1 text-sm text-white/80 leading-snug line-clamp-1">
              {selectedEntry.clue}
            </p>

            <span className="flex-shrink-0 hidden sm:block font-mono text-xs px-2 py-1 bg-white/5 rounded-lg text-white/30">
              {selectedEntry.word.length} букв
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheck}
              title="Проверить все заполненные клетки"
              className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/45 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <ShieldCheck size={12} />
              <span className="hidden sm:inline">Проверить</span>
              <span className="bg-emerald-500/20 text-emerald-200 rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-mono font-bold">
                {checkCount}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHint}
              title="Открыть следующую неверную букву"
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 hover:border-amber-500/50 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <Lightbulb size={12} />
              <span className="hidden sm:inline">Подсказка</span>
              <span className="bg-amber-500/30 text-amber-200 rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-mono font-bold">
                {hintUsed}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-[108px] z-30 px-4 sm:px-6 pt-2"
          >
            <div
              className={`max-w-[1600px] mx-auto border rounded-2xl px-4 py-3 text-xs sm:text-sm backdrop-blur-xl ${feedbackToneStyles[checkFeedback.tone]}`}
            >
              {checkFeedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              Нажмите на клетку повторно, чтобы сменить направление (→ / ↓)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto px-3 sm:px-4 py-5 sm:py-6">
        <div className="hidden lg:grid gap-4 items-start" style={{ gridTemplateColumns: '270px 1fr 270px' }}>
          <BentoCard
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 190px)', position: 'sticky', top: '110px' }}
          >
            <TheorySidebar solvedEntries={solvedEntries} selectedEntryId={selectedEntryId} />
          </BentoCard>

          <div className="flex flex-col gap-4">
            <BentoCard>
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
                invalidCells={invalidCells}
                onCellChange={handleCellChange}
                onEntrySelect={handleEntrySelect}
                selectedEntryId={selectedEntryId}
                revealedCells={revealedCells}
              />
            </BentoCard>

            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Разгадано" value={solvedEntries.size} color="#ccff00" />
              <StatCard
                label="Осталось"
                value={CROSSWORD_ENTRIES.length - solvedEntries.size}
                color="#8b5cf6"
              />
              <StatCard label="Очки" value={score} color="#34d399" />
              <StatCard label="Время" value={formatElapsed(elapsedSeconds)} color="#60a5fa" />
            </div>
          </div>

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

        <div className="lg:hidden flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Разгадано" value={solvedEntries.size} color="#ccff00" />
            <StatCard
              label="Осталось"
              value={CROSSWORD_ENTRIES.length - solvedEntries.size}
              color="#8b5cf6"
            />
            <StatCard label="Очки" value={score} color="#34d399" />
            <StatCard label="Время" value={formatElapsed(elapsedSeconds)} color="#60a5fa" />
          </div>

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
              invalidCells={invalidCells}
              onCellChange={handleCellChange}
              onEntrySelect={handleEntrySelect}
              selectedEntryId={selectedEntryId}
              revealedCells={revealedCells}
            />
          </BentoCard>

          <BentoCard>
            <button onClick={() => setShowCluesMobile((value) => !value)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#ccff00]" />
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">
                  Вопросы
                </span>
              </div>
              {showCluesMobile ? (
                <ChevronUp size={16} className="text-white/30" />
              ) : (
                <ChevronDown size={16} className="text-white/30" />
              )}
            </button>
            <AnimatePresence>
              {showCluesMobile ? (
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
              ) : null}
            </AnimatePresence>
          </BentoCard>

          <BentoCard>
            <button
              onClick={() => setShowTheoryMobile((value) => !value)}
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
              {showTheoryMobile ? (
                <ChevronUp size={16} className="text-white/30" />
              ) : (
                <ChevronDown size={16} className="text-white/30" />
              )}
            </button>
            <AnimatePresence>
              {showTheoryMobile ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <TheorySidebar solvedEntries={solvedEntries} selectedEntryId={selectedEntryId} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </BentoCard>
        </div>
      </main>

      <footer className="border-t border-white/5 py-5 px-4 sm:px-6 mt-4">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-white/20 font-mono">
            FinCross · Финансовый кроссворд · 20 терминов
          </span>
          <span className="text-xs text-white/15 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Прогресс, время и очки сохраняются в браузере
          </span>
        </div>
      </footer>

      <VictoryModal
        isVisible={showVictory}
        score={score}
        elapsedLabel={formatElapsed(elapsedSeconds)}
        accuracy={accuracy}
        hintUsed={hintUsed}
        checkCount={checkCount}
        onReset={handleReset}
      />
    </div>
  );
}

function BentoCard({
  children,
  className = '',
  style = {},
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
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
        key={`${label}-${value}`}
        initial={{ opacity: 0.75, y: 2 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="text-2xl font-black font-mono tabular-nums leading-none mb-1"
        style={{ color }}
      >
        {value}
      </motion.div>
      <div className="text-[11px] text-white/35 font-medium tracking-wide">{label}</div>
    </div>
  );
}

function pluralize(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
