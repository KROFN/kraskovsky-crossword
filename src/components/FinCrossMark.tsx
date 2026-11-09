import type { SVGProps } from 'react';

/**
 * Crossword intersection: four word paths converge on one shared cell.
 * Strict single-color mark; accent is supplied by CSS.
 */
export default function FinCrossMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M16 2H28V16H42V28H28V42H16V28H2V16H16V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 16H28V28H16V16Z" fill="currentColor" />
      <path d="M22 5V12M22 32V39M5 22H12M32 22H39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
