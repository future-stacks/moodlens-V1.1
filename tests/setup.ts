import '@testing-library/jest-dom/vitest';

// jsdom lacks matchMedia, which motion uses for prefers-reduced-motion.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Vitest globals are off, so Testing Library can't register its own cleanup.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
