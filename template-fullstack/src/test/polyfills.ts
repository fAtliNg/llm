import { vi } from 'vitest';

/**
 * jsdom lacks a few browser APIs that Radix primitives (Select, Dialog, Popover) rely on.
 * Loaded once from the Vitest setup file. Stubs are inert: layout never happens in jsdom.
 */
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })),
);

const elementStubs = {
  scrollIntoView: vi.fn(),
  hasPointerCapture: vi.fn(() => false),
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
};

for (const [name, value] of Object.entries(elementStubs)) {
  Object.defineProperty(Element.prototype, name, { value, writable: true, configurable: true });
}
