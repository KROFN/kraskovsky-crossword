import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ShieldCheck, List, BookOpen, ChevronLeft, ChevronRight, X, Map as MapIcon, CheckCircle2 } from 'lucide-react';

import Header from './components/Header';
import CrosswordGrid from './components/CrosswordGrid';
import MobileAnswer from './components/MobileAnswer';
import GridOverview from './components/GridOverview';
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
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 850px)').matches);
  const [showMap, setShowMap] = useState(false);
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
    const mq = window.matchMedia('(max-width: 850px)');
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
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

  return (
    <div className="fc-app">
      <Header solvedCount={solvedEntries.size} score={score} elapsedLabel={formatElapsed(elapsedSeconds)} onReset={resetWithConfirmation} />
      <main className="fc-main" id="play">
        <div className="fc-page-heading">
          <div>
            <h1>Финансовый кроссворд<span>.</span></h1>
            <p>20 понятий о рынке, деньгах и инвестициях. Выбери слово и найди ответ.</p>
          </div>
          <div className="fc-heading-progress">
            <strong>{progress}%</strong>
            <span>пройдено</span>
          </div>
        </div>

        <div className="fc-workspace">
          <section className="fc-board" aria-label="Финансовый кроссворд">
            <div className="fc-board-heading">
              <div className="fc-board-title-wrap">
                <span className="fc-board-eyebrow">Игровое поле</span>
                <h2>{isCompact ? 'Твоё слово' : 'Кроссворд'}</h2>
              </div>
              <div className="fc-board-stat">
                <strong>{solvedEntries.size}<span> / {totalWords}</span></strong>
                <small>решено</small>
              </div>
            </div>

            <div className="fc-active-clue">
              <div className="fc-active-top">
                <span className="fc-active-number">
                  {selectedEntry ? `№ ${selectedEntry.number} · ${selectedEntry.direction === 'across' ? 'по горизонтали' : 'по вертикали'}` : 'Выбери вопрос'}
                </span>
                <span className="fc-active-length">{selectedEntry?.word.length ?? 0} букв</span>
              </div>
              <p className="fc-clue-question" aria-live="polite">{selectedEntry?.clue || 'Выбери слово в списке вопросов.'}</p>
              {isCompact && <div className="fc-word-navigation">
                <button type="button" onClick={() => pickNearby(-1)} aria-label="Предыдущее слово"><ChevronLeft size={19} /> Назад</button>
                <span>{Math.max(1,currentIndex+1)} / {totalWords}</span>
                <button type="button" onClick={() => pickNearby(1)} aria-label="Следующее слово">Дальше <ChevronRight size={19} /></button>
              </div>}
            </div>

            {isCompact && selectedEntry ? (
              <MobileAnswer
                entry={selectedEntry}
                answers={userAnswers}
                solvedEntries={solvedEntries}
                revealedCells={revealedCells}
                invalidCells={invalidCells}
                onCellChange={handleCellChange}
                onNext={() => pickNearby(1)}
              />
            ) : !isCompact ? (
              <div className="fc-board-grid">
                <CrosswordGrid
                  userAnswers={userAnswers}
                  solvedEntries={solvedEntries}
                  invalidCells={invalidCells}
                  onCellChange={handleCellChange}
                  onEntrySelect={handleEntrySelect}
                  selectedEntryId={selectedEntryId}
                  revealedCells={revealedCells}
                />
              </div>
            ) : null}

            <div className="fc-board-toolbar">
              <div className="fc-board-score">
                <span>Счёт</span><strong>{(hasStarted ? score : 0).toLocaleString('ru-RU')}</strong>
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
              <button type="button" onClick={() => setShowMap(v => !v)} aria-expanded={showMap}>
                <MapIcon size={19} /> {showMap ? 'Скрыть карту' : 'Карта'}
              </button>
            </div>}
            {isCompact && showMap && <div className="fc-mobile-overview">
              <div className="fc-overview-heading"><strong>Весь кроссворд</strong><span>Синим выделено выбранное слово</span></div>
              <GridOverview selectedEntryId={selectedEntryId} solvedEntries={solvedEntries} answers={userAnswers} />
            </div>}
          </section>

          {!isCompact && <aside className="fc-reference" aria-label="Вопросы и теория">
            <div className="fc-reference-heading">
              <strong>Вопросы и ответы</strong><span>20 слов</span>
            </div>
            {reference}
          </aside>}
        </div>

        <div className="fc-under-game">
          <CheckCircle2 size={17} aria-hidden="true"/>
          <p>Прогресс сохраняется автоматически. После разгаданного слова откроется его объяснение во вкладке «Теория».</p>
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
