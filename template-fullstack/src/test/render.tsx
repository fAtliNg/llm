import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { routes } from '@/app/router';
import { makeStore, type AppStore } from '@/app/store';

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Fresh store per test by default; pass one to inspect or preload state. */
  store?: AppStore;
  /** URL the memory router starts at. */
  initialEntries?: string[];
}

/**
 * Renders a component inside the Redux store and a memory router.
 * Returns a ready `user` from user-event alongside the usual RTL queries.
 */
export function renderWithProviders(
  ui: ReactElement,
  { store = makeStore(), initialEntries = ['/'], ...options }: ProviderOptions = {},
) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = render(<RouterProvider router={router} />, { wrapper, ...options });
  return { user: userEvent.setup(), store, router, ...view };
}

/** Renders the real application routes at the given URL. Use it for page-level tests. */
export function renderApp(
  initialEntries: string[] = ['/'],
  { store = makeStore(), appRoutes = routes }: { store?: AppStore; appRoutes?: RouteObject[] } = {},
) {
  const router = createMemoryRouter(appRoutes, { initialEntries });
  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { user: userEvent.setup(), store, router, ...view };
}
