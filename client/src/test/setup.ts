import '@testing-library/jest-dom';

// jsdom doesn't include Path2D
if (typeof Path2D === 'undefined') {
  (globalThis as Record<string, unknown>).Path2D = class Path2D {
    constructor(_path?: string) {}
  };
}
