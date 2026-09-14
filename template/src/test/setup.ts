import '@testing-library/jest-dom/vitest';
import '@/test/polyfills';

import { afterAll, afterEach, beforeAll } from 'vitest';

import { db } from '@/mocks/db';
import { server } from '@/mocks/server';

// React Testing Library unmounts after each test on its own because `globals: true` is set.

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  db.reset();
});

afterAll(() => {
  server.close();
});
