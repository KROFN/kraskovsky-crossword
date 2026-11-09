import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, MoveHorizontal, Keyboard, ShieldCheck, ListOrdered, BookOpenText, ArrowUpRight } from 'lucide-react';

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
  const [activePanel, setActivePanel] = useState<'clues' | 'theory'>('clues');
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

  const totalWords = CROSSWORD_ENTRIES.length;
  const progress = Math.round((solvedEntries.size / totalWords) * 100);

  return (
    <div className="fc-app">
      <Header
        solvedCount={solvedEntries.size}
        score={score}
        elapsedLabel={formatElapsed(elapsedSeconds)}
        onReset={() => {
          if (window.confirm('Начать кроссворд заново? Весь текущий прогресс будет сброшен.')) {
            handleReset();
          }
        }}
      />

      <HeroSection />

      <main className="fc-main" id="play">
        <div className="fc-section-intro">
          <div>
            <div className="fc-small-label">01 / ИГРОВОЕ ПОЛЕ</div>
            <h2>Собери картину рынка<span className="fc-title-period">.</span></h2>
          </div>
          <p>Выбирай вопрос, заполняй пересечения, проверяй себя. Никакой спешки — только ты и двадцать финансовых понятий.</p>
        </div>

        <div className="fc-workspace">
          <section className="fc-board" aria-label="Игровое поле финансового кроссворда">
            <div className="fc-board-heading">
              <div className="fc-board-title-wrap">
                <span className="fc-board-edition">FINCROSS / NO. 001</span>
                <h3>Кроссворд</h3>
              </div>
              <span className="fc-board-pct">{progress.toString().padStart(2, '0')}<small>%</small></span>
            </div>

            <div className="fc-current-question" aria-live="polite">
              <span className="fc-current-marker">{selectedEntry
                ? `${String(selectedEntry.number).padStart(2, '0')}${selectedEntry.direction === 'across' ? '→' : '↓'}`
                : '—'}</span>
              <p>{selectedEntry?.clue || 'Выбери вопрос или клетку на поле'}</p>
              {selectedEntry ? <span className="fc-current-length">{selectedEntry.word.length} букв</span> : null}
            </div>

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

            <div className="fc-board-scroller-hint"><MoveHorizontal size={14} /><span>На небольшом экране поле можно двигать по горизонтали</span></div>

            <div className="fc-board-toolbar">
              <div className="fc-board-stats">
                <div><span>СЛОВА</span><strong>{String(solvedEntries.size).padStart(2, '0')}<em> / {totalWords}</em></strong></div>
                <div><span>СЧЁТ</span><strong>{score.toLocaleString('ru-RU')}</strong></div>
              </div>
              <div className="fc-board-actions">
                <button type="button" className="fc-btn fc-btn-check" onClick={handleCheck} title="Проверить заполненные клетки">
                  <ShieldCheck size={17} /><span>Проверить</span>
                </button>
                <button type="button" className="fc-btn fc-btn-hint" onClick={handleHint} title="Открыть одну букву в выбранном слове">
                  <Lightbulb size={17} /><span>Подсказка</span>
                  {hintUsed > 0 ? <small>{hintUsed}</small> : null}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {checkFeedback ? (
                <motion.div
                  key={checkFeedback.message}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  className={`fc-feedback fc-feedback-${checkFeedback.tone}`}
                >
                  {checkFeedback.message}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          <aside className="fc-reference" aria-label="Вопросы и теория">
            <div className="fc-reference-heading">
              <span className="fc-small-label">02 / СПРАВОЧНИК</span>
              <span className="fc-reference-count">{String(totalWords).padStart(2, '0')} ТЕРМИНОВ</span>
            </div>
            <div className="fc-reference-tabs" role="tablist" aria-label="Выбор справочного раздела">
              <button type="button" role="tab" aria-selected={activePanel === 'clues'} className={activePanel === 'clues' ? 'is-active' : ''} onClick={() => setActivePanel('clues')}>
                <ListOrdered size={17} /> Вопросы
              </button>
              <button type="button" role="tab" aria-selected={activePanel === 'theory'} className={activePanel === 'theory' ? 'is-active' : ''} onClick={() => setActivePanel('theory')}>
                <BookOpenText size={17} /> Теория <span>{solvedEntries.size}</span>
              </button>
            </div>
            <div className="fc-reference-content" role="tabpanel" aria-label={activePanel === 'clues' ? 'Список вопросов' : 'Открытая теория'}>
              {activePanel === 'clues' ? (
                <CluesList
                  selectedEntryId={selectedEntryId}
                  solvedEntries={solvedEntries}
                  onSelectEntry={(id) => {
                    handleEntrySelect(id);
                    if (window.innerWidth <= 1020) {
                      document.querySelector('.fc-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                />
              ) : (
                <TheorySidebar solvedEntries={solvedEntries} selectedEntryId={selectedEntryId} />
              )}
            </div>
          </aside>
        </div>

        <div className="fc-outro">
          <div>
            <span className="fc-small-label">03 / НА ЗАМЕТКУ</span>
            <h2>Понимать рынок<br /><i>интереснее, чем угадывать.</i></h2>
          </div>
          <p>Кроссворд — это только начало. После каждого правильного ответа в разделе «Теория» открывается объяснение термина. Можно возвращаться к ним в любой момент.</p>
          <ArrowUpRight size={25} strokeWidth={1.5} aria-hidden="true"/>
        </div>
      </main>

      <footer className="fc-footer">
        <span>FINCROSS — A FINANCIAL LITERACY PUZZLE</span>
        <span>Прогресс сохраняется в браузере <span aria-hidden="true">●</span> 2026</span>
      </footer>

      <AnimatePresence>
        {showKeyboardTip ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fc-keyboard-tip"
          >
            <Keyboard size={16} /><span>Повторное нажатие на клетку меняет направление слова</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

function pluralize(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
