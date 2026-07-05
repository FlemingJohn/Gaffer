// Inline SVG icons (no emojis). Each scales with font-size (1em) and inherits
// colour via currentColor, so they theme automatically.

const base = {
  viewBox: '0 0 24 24',
  width: '1em',
  height: '1em',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconBall = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7l4 3-1.6 4.8H9.6L8 10z" />
    <path d="M12 3v4M20.3 9.2l-4 .8M18.4 18.4l-3-3.2M5.6 18.4l3-3.2M3.7 9.2l4 .8" />
  </svg>
);

export const IconMatch = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M12 5v14" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const IconHistory = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconTeam = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.5a3 3 0 0 1 0 6M20.5 19a5.5 5.5 0 0 0-3-4.9" />
  </svg>
);

export const IconSpeaker = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 9a4 4 0 0 1 0 6" />
  </svg>
);

export const IconMic = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
  </svg>
);

export const IconStop = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const IconRedo = (p) => (
  <svg {...base} {...p}>
    <path d="M20 8a8 8 0 1 0 2 6" />
    <path d="M20 4v4h-4" />
  </svg>
);

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);
