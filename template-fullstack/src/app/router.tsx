import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { MetaRoute } from '@/meta/meta-route';

/** Every page comes from meta/pages: MetaRoute looks the URL up there and shows the page or the 404. */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: MetaRoute },
      { path: '*', Component: MetaRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
