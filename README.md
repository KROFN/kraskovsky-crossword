# FINCROSS

Интерактивный кроссворд по финансовым терминам: 20 слов и 118 пересекающихся клеток. React + TypeScript + Vite, без аккаунта и сервера.

## Как устроена игра

- **Desktop (шире 1160 px):** полноценная сетка 19 × 26, выбор клеток и вопросов, стрелки клавиатуры, проверка и подсказки. Tab выходит из сетки, а не зацикливает фокус на ней.
- **Mobile / tablet (до 1160 px):** та же полноценная **интерактивная сетка со всеми пересечениями**, а не режим угадывания слов. У сетки собственная двумерная прокрутка; размер клеток 44/52/60 px регулируется кнопками, а выбор вопроса и ввод автоматически показывают нужную клетку. Вопрос, предыдущий/следующий термин и справочник доступны без отдельного длинного лендинга.
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

## Academic UI preview (2026-11-09)

This is a visual preview for senior school economics/social science practice,
not an arcade game, retro newspaper or generic SaaS dashboard.
The preview branch does not alter the production site.

- The full 118-cell crossword is always interactive.
- An understated geometric crossing mark is the logo and favicon.
- Cool-neutral surfaces, indigo selection, serious typography.
- The active clue is emphasized; all questions remain accessible.
- A typical 768–900px desktop viewport fits the complete crossword.
- Mobile preserves the full pan/zoom grid and keyboard semantics.

Design review sources: the Anthropic Frontend Design skill, UI-UX Pro Max
accessibility guidance, and curated One Page Love editorial/informational
references. UI-UX Pro Max's kid-centric education palette and comic fonts
were explicitly rejected as inappropriate for older students.

Desktop and mobile preview images show demonstration answers, not real
player progress. QA covers 320, 390, 768, 1024 and 1440px, intersections,
clue navigation, persistence, reset, full victory and theory unlock.
