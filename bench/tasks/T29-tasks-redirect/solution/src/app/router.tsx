import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { NotFoundPage } from '@/pages/not-found-page';
import { TaskEditPage } from '@/pages/task-edit-page';
import { TaskNewPage } from '@/pages/task-new-page';
import { TasksPage } from '@/pages/tasks-page';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: TasksPage },
      { path: 'tasks', element: <Navigate to="/" replace /> },
      { path: 'tasks/new', Component: TaskNewPage },
      { path: 'tasks/:taskId/edit', Component: TaskEditPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const router = createBrowserRouter(routes);
