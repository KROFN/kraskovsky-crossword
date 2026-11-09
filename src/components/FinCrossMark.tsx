import type { SVGProps } from 'react';

/**
 * FINCROSS: five intersecting puzzle tiles.
 * The symbol is a crossword intersection, not an initial/lettermark.
 */
export default function FinCrossMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false" {...props}>
      <rect x="0.9" y="0.9" width="46.2" height="46.2" rx="11" fill="#F9D875" stroke="#263B30" strokeWidth="1.8" />
      <g stroke="#263B30" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="17.3" y="4.8" width="13.4" height="13.4" rx="1.6" fill="#FFFDF3"/>
        <rect x="4.8" y="17.3" width="13.4" height="13.4" rx="1.6" fill="#FFFDF3"/>
        <rect x="17.3" y="17.3" width="13.4" height="13.4" rx="1.6" fill="#E57C5B"/>
        <rect x="29.8" y="17.3" width="13.4" height="13.4" rx="1.6" fill="#FFFDF3"/>
        <rect x="17.3" y="29.8" width="13.4" height="13.4" rx="1.6" fill="#FFFDF3"/>
      </g>
      <path d="M21.1 23.9L23.4 26.1L27.3 21.7" stroke="#263B30" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="19.8" cy="7.3" r="1.1" fill="#263B30"/>
    </svg>
  );
}
