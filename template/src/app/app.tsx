import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router/dom';

import { router } from '@/app/router';
import { store } from '@/app/store';

export function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
