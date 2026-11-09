import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ShieldCheck, List, BookOpen, ChevronLeft, ChevronRight, X, LocateFixed, ZoomIn, ZoomOut, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

import Header from './components/Header';
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
  const [activePanel, setActivePanel] = useState<'clues' | 'theory'>('clues');
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1160px)').matches);
  const [screen, setScreen] = useState(() => ({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  const [cellZoom, setCellZoom] = useState(44);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1160px)');
    const sync = () => {
      setIsCompact(mq.matches);
      setScreen({ width: window.innerWidth, height: window.innerHeight });
    };
    sync();
    mq.addEventListener('change', sync);
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLButtonElement>('.fc-drawer-close')?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onEscape);
      returnFocus?.focus({ preventScroll: true });
    };
  }, [drawerOpen]);

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

  const totalWords = CROSSWORD_ENTRIES.length;
  const progress = Math.round((solvedEntries.size / totalWords) * 100);
  // A 19-row puzzle should fit in a normal desktop viewport without scrolling.
  // Reserve the header, title, board bar, and action rail before sizing cells.
  const desktopCellSize = Math.max(20, Math.min(
    32,
    Math.floor((screen.height - 285) / 19) - 2,
    Math.floor((screen.width - 470) / 26) - 2
  ));
  const currentIndex = CROSSWORD_ENTRIES.findIndex(e => e.id === selectedEntryId);
  const pickNearby = (direction: -1 | 1) => {
    const next = (currentIndex + direction + totalWords) % totalWords;
    setSelectedEntryId(CROSSWORD_ENTRIES[next].id);
    setCheckFeedback(null);
  };
  const selectFromList = (id: number) => {
    setSelectedEntryId(id);
    setDrawerOpen(false);
    setCheckFeedback(null);
    if (isCompact) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetWithConfirmation = () => {
    if (window.confirm('Начать кроссворд заново? Текущий прогресс будет сброшен.')) {
      handleReset();
      setDrawerOpen(false);
    }
  };
  const reference = (
    <>
      <div className="fc-reference-tabs" role="tablist" aria-label="Справочник">
        <button type="button" role="tab" aria-selected={activePanel === 'clues'} className={activePanel === 'clues' ? 'is-active' : ''} onClick={() => setActivePanel('clues')}>
          <List size={17} /> Вопросы
        </button>
        <button type="button" role="tab" aria-selected={activePanel === 'theory'} className={activePanel === 'theory' ? 'is-active' : ''} onClick={() => setActivePanel('theory')}>
          <BookOpen size={17} /> Теория {solvedEntries.size > 0 && <span>{solvedEntries.size}</span>}
        </button>
      </div>
      <div className="fc-reference-content" role="tabpanel" aria-label={activePanel === 'clues' ? 'Вопросы' : 'Теория'}>
        {activePanel === 'clues'
          ? <CluesList selectedEntryId={selectedEntryId} solvedEntries={solvedEntries} onSelectEntry={selectFromList} />
          : <TheorySidebar solvedEntries={solvedEntries} selectedEntryId={selectedEntryId} />}
      </div>
    </>
  );

  const activeClue = (
    <div className={isCompact ? "fc-active-clue" : "fc-side-current"}>
      <div className="fc-active-top">
        <span className="fc-active-number">
          {selectedEntry ? `№ ${String(selectedEntry.number).padStart(2, '0')} · ${selectedEntry.direction === 'across' ? 'Горизонталь' : 'Вертикаль'}` : 'Выбери слово'}
        </span>
        <span className="fc-active-length">{selectedEntry?.word.length ?? 0} букв</span>
      </div>
      <p className="fc-clue-question" aria-live="polite">
        {selectedEntry?.clue || 'Выбери вопрос из списка.'}
      </p>
      {isCompact && <div className="fc-word-navigation">
        <button type="button" onClick={() => pickNearby(-1)} aria-label="Предыдущее слово"><ChevronLeft size={19} /> Назад</button>
        <span>{Math.max(1, currentIndex + 1)} / {totalWords}</span>
        <button type="button" onClick={() => pickNearby(1)} aria-label="Следующее слово">Дальше <ChevronRight size={19} /></button>
      </div>}
    </div>
  );

  return (
    <div className="fc-app">
      <Header solvedCount={solvedEntries.size} elapsedLabel={formatElapsed(elapsedSeconds)} />
      <main className="fc-main" id="play">
        <div className="fc-page-heading">
          <div className="fc-headline-group">
            <span className="fc-issue-tag"><Sparkles size={14} aria-hidden="true" /> ИГРА, В КОТОРОЙ СХОДЯТСЯ СЛОВА</span>
            <h1>Разгадай <span>рынок</span></h1>
          </div>
          <div className="fc-heading-aside">
            <span>20 финансовых терминов</span>
            <strong>{progress}% собрано</strong>
          </div>
        </div>

        <div className="fc-workspace">
          <section className="fc-board" aria-label="Финансовый кроссворд">
            <div className="fc-board-heading">
              <div className="fc-board-title-wrap">
                <span className="fc-board-index">КРОССВОРД / № 01</span>
              </div>
              <div className="fc-board-stat">
                <span>СОБРАНО СЛОВ</span>
                <strong>{String(solvedEntries.size).padStart(2,'0')}<em> / {totalWords}</em></strong>
              </div>
            </div>

            {isCompact && activeClue}

            {isCompact && <div className="fc-zoom-bar">
              <p>Перемещайте сетку пальцем. Нажмите на клетку, чтобы ввести букву.</p>
              <div className="fc-zoom-controls" role="group" aria-label="Размер клеток">
                <button type="button" aria-label="Уменьшить клетки" disabled={cellZoom <= 44} onClick={() => setCellZoom(value => Math.max(44, value - 8))}><ZoomOut size={18} /></button>
                <span>{Math.round(cellZoom / 44 * 100)}%</span>
                <button type="button" aria-label="Увеличить клетки" disabled={cellZoom >= 60} onClick={() => setCellZoom(value => Math.min(60, value + 8))}><ZoomIn size={18} /></button>
              </div>
            </div>}
            <div className="fc-board-grid">
              <CrosswordGrid
                userAnswers={userAnswers}
                solvedEntries={solvedEntries}
                invalidCells={invalidCells}
                onCellChange={handleCellChange}
                onEntrySelect={handleEntrySelect}
                selectedEntryId={selectedEntryId}
                revealedCells={revealedCells}
                compact={isCompact}
                cellSize={isCompact ? cellZoom : desktopCellSize}
                recenterSignal={recenterSignal}
              />
            </div>

            <div className="fc-board-toolbar">
              <div className="fc-board-score">
                <span>НАБРАНО ОЧКОВ</span><strong>{(hasStarted ? score : 0).toLocaleString('ru-RU')}</strong>
              </div>
              <div className="fc-board-actions">
                <button type="button" className="fc-action fc-action-secondary" onClick={handleHint} title="Открыть букву в выбранном слове">
                  <Lightbulb size={17} /> Подсказка
                </button>
                <button type="button" className="fc-action fc-action-primary" onClick={handleCheck} title="Проверить заполненные буквы">
                  <ShieldCheck size={17} /> Проверить
                </button>
              </div>
            </div>

            <AnimatePresence>
              {checkFeedback && <motion.div key={checkFeedback.message}
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                role="status" className={`fc-feedback fc-feedback-${checkFeedback.tone}`}>{checkFeedback.message}</motion.div>}
            </AnimatePresence>

            {isCompact && <div className="fc-mobile-tools">
              <button type="button" onClick={() => { setActivePanel('clues'); setDrawerOpen(true); }}>
                <List size={19} /> Все вопросы
              </button>
              <button type="button" onClick={() => { setActivePanel('theory'); setDrawerOpen(true); }}>
                <BookOpen size={19} /> Теория {solvedEntries.size > 0 ? `(${solvedEntries.size})` : ''}
              </button>
              <button type="button" onClick={() => setRecenterSignal(value => value + 1)}>
                <LocateFixed size={19} /> К слову
              </button>
            </div>}
          </section>

          {!isCompact && <aside className="fc-reference" aria-label="Вопросы и теория">
            {activeClue}
            <div className="fc-reference-heading">
              <strong>Подсказки к словам</strong><span>лист №01</span>
            </div>
            {reference}
          </aside>}
        </div>

        <div className="fc-under-game">
          <span><CheckCircle2 size={17} aria-hidden="true" /> Прогресс сохраняется сам. Разгадай слово — откроешь его объяснение.</span>
          <button type="button" className="fc-restart-link" onClick={resetWithConfirmation} aria-label="Начать кроссворд заново">
            <RotateCcw size={14} /> Начать заново
          </button>
        </div>
      </main>

      {isCompact && drawerOpen && <div className="fc-drawer-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDrawerOpen(false);
      }}>
        <section className="fc-drawer" role="dialog" aria-modal="true" aria-label="Список вопросов и теория">
          <div className="fc-drawer-header">
            <strong>Справочник</strong>
            <button type="button" className="fc-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Закрыть справочник"><X size={23}/></button>
          </div>
          {reference}
        </section>
      </div>}

      <VictoryModal
        isVisible={showVictory} score={score} elapsedLabel={formatElapsed(elapsedSeconds)}
        accuracy={accuracy} hintUsed={hintUsed} checkCount={checkCount} onReset={handleReset}
      />
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
