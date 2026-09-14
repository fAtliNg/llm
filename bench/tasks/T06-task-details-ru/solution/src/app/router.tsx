import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { NotFoundPage } from '@/pages/not-found-page';
import { TaskEditPage } from '@/pages/task-edit-page';
import { TaskNewPage } from '@/pages/task-new-page';
import { TaskPage } from '@/pages/task-page';
import { TasksPage } from '@/pages/tasks-page';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: TasksPage },
      { path: 'tasks/new', Component: TaskNewPage },
      { path: 'tasks/:taskId', Component: TaskPage },
      { path: 'tasks/:taskId/edit', Component: TaskEditPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const router = createBrowserRouter(routes);
