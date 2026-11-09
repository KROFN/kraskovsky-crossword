# Kraskovsky Crossword

FINCROSS — интерактивный финансовый кроссворд с редакционным интерфейсом.

> **Status:** Small prototype.  
> Built as an interactive browser exercise with a fixed crossword layout and local progress storage.

## What it does

The app turns financial-market vocabulary into an interactive crossword experience:

- fixed 19 × 26 crossword grid
- financial terms and theory notes
- clue list and theory sidebar
- keyboard-friendly answer input
- localStorage progress saving
- timer, hints and answer checking
- score calculation
- victory modal
- editorial responsive layout with a horizontally navigable mobile grid

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- react-confetti

## Run locally

```bash
npm install
npm run dev
```

or:

```bash
bun install
bun run dev
```

Open the local Vite URL shown in the terminal.

## Notes

This repository is kept public as a compact interactive education prototype.

## UI / visual system (2026 redesign)

- Warm editorial canvas, structured dark game board and large financial-puzzle typography.
- Two-column desktop layout: crossword plus a switchable Questions / Theory reference panel.
- Mobile horizontal crossword navigation follows the selected term; clue selection returns to the board.
- Game mechanics and `fincross_progress_v5` localStorage format are unchanged, so existing progress is preserved.
- Accessible progress bar, active clue controls, keyboard input and reduced-motion-friendly victory screen.

Validation: `npm run typecheck && npm run build`.
