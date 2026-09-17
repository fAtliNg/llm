import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootLayout } from '@/app/root-layout';
import { EmployeeNewPage } from '@/pages/employee-new-page';
import { EmployeesPage } from '@/pages/employees-page';
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
      { path: 'employees', Component: EmployeesPage },
      { path: 'employees/new', Component: EmployeeNewPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const router = createBrowserRouter(routes);
