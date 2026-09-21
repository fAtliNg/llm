import '@testing-library/jest-dom/vitest';
import '@/test/polyfills';

import { configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { resetBackend, server } from '@/mocks/server';

// React Testing Library unmounts after each test on its own because `globals: true` is set.

// Elements rendered from meta carry their meta id, so tests find them with getByTestId(id).
configure({ testIdAttribute: 'data-meta-id' });

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  resetBackend();
});

afterAll(() => {
  server.close();
});
