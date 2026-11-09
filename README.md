# FINCROSS

Интерактивный кроссворд по финансовым терминам: 20 слов и 118 пересекающихся клеток. React + TypeScript + Vite, без аккаунта и сервера.

## Как устроена игра

- **Desktop (от 851 px):** полноценная сетка 19 × 26, выбор клеток и вопросов, стрелки клавиатуры, проверка и подсказки. Tab выходит из сетки, а не зацикливает фокус на ней.
- **Mobile / tablet (до 850 px):** та же полноценная **интерактивная сетка со всеми пересечениями**, а не режим угадывания слов. У сетки собственная двумерная прокрутка; размер клеток 44/52/60 px регулируется кнопками, а выбор вопроса и ввод автоматически показывают нужную клетку. Вопрос, предыдущий/следующий термин и справочник доступны без отдельного длинного лендинга.
- **Общая логика:** буквы вводятся напрямую в общую сетку, ответы пересекаются в едином наборе клеток; сохраняются подсказки, проверки, время, очки и статус решения. После верного слова открывается объяснение термина.
- **Хранение:** текущий прогресс автоматически сохраняется в `localStorage` по ключу `fincross_progress_v5`; формат совместим с предыдущей версией.

## Локальный запуск

```bash
npm ci
npm run typecheck
npm run dev
```

Production-сборка: `npm run build`. Проект создаёт самостоятельный статический HTML через `vite-plugin-singlefile` и размещается на Vercel.

## Дизайн и UX

Game-first интерфейс: вопрос и ввод ответа находятся вместе, без отдельного рекламного первого экрана. На desktop сетка и список вопросов находятся рядом; на телефоне та же сетка управляется касаниями, с минимальным размером клетки 44 px, панорамированием по X/Y и прокруткой к выбранному слову. Отдельного поля для ответа нет. Один основной цвет, системная типографическая иерархия. Состояния проверки и завершения имеют текстовое подтверждение.

## Регрессионная проверка

Проверять ширины **320, 390, 768, 1024, 1440 px**, отсутствие горизонтального overflow, правильный ввод кириллицы, переходы между словами, пересечения, подсказку, проверку, открытие теории после решения, сохранение и восстановление прогресса, сброс и финальный экран. Проверка `npm run typecheck && npm run build` — необходима, но не заменяет браузерные UX-тесты.

## Visual refresh (2026-11-09)

The UI was redesigned against references from the real puzzle/game category,
not generic SaaS dashboard templates:

- **Puzzmo** (https://www.puzzmo.com/) — the crossword itself as the central visual
  object, expressive puzzle masthead, clear active word and clue relationship.
- **Cross|word** (https://www.sfgate.com/puzzles/article/crossword-19367635.php) —
  clean grid/clue pairing and highlighted active answer.
- **One Page Love** (https://onepagelove.com/concept-capers/) — playful game
  identity without a neon/dashboard aesthetic.

Design direction: a warm puzzle zine with dark ink, maize and coral. The graphic
symbol is an intersection of five crossword cells (not an initial/lettermark),
and is reused as the favicon. The desktop board resizes its cell size to fit
19 rows in common 768–900px-tall browser windows. Reset lives below the game,
not as a visually dominant rightmost header action.

Screenshot: `public/desktop-preview.webp` is generated with a few sample
answers stored in session-local browser state. It is a design preview, not a
claim about real player progress.
