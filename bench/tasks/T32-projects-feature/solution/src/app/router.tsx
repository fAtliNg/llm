import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { ProjectNewPage } from '@/pages/project-new-page';
import { ProjectsPage } from '@/pages/projects-page';
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
      { path: 'tasks/new', Component: TaskNewPage },
      { path: 'tasks/:taskId/edit', Component: TaskEditPage },
      { path: 'projects', Component: ProjectsPage },
      { path: 'projects/new', Component: ProjectNewPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const router = createBrowserRouter(routes);
