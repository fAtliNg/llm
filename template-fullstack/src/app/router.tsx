import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { MetaRoute } from '@/meta/meta-route';
import { TaskEditPage } from '@/pages/task-edit-page';
import { TaskNewPage } from '@/pages/task-new-page';
import { TasksPage } from '@/pages/tasks-page';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: TasksPage },
      { path: 'tasks/new', Component: TaskNewPage },
      { path: 'tasks/:taskId/edit', Component: TaskEditPage },
      // Everything else is looked up in meta/pages by URL; MetaRoute shows the page or the 404.
      { path: '*', Component: MetaRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
