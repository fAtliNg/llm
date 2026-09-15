import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app';

import './index.css';

/** Dev only: serve `/api` from the in-memory mock. A failure must not block the app. */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) {
    return;
  }
  try {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  } catch (error: unknown) {
    console.warn('[mocks] Service worker unavailable, requests will hit the network.', error);
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

await enableMocking();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
