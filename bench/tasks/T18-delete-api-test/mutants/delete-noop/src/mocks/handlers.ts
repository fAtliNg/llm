import { http, HttpResponse } from 'msw';

import { taskInputSchema } from '@/features/tasks/model';
import { db } from '@/mocks/db';

export const handlers = [
  http.get('/api/tasks', () => HttpResponse.json(db.list())),

  http.get('/api/tasks/:taskId', ({ params }) => {
    const task = db.find(String(params.taskId));
    return task
      ? HttpResponse.json(task)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),

  http.post('/api/tasks', async ({ request }) => {
    const parsed = taskInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json({ message: 'Invalid task' }, { status: 400 });
    }
    return HttpResponse.json(db.create(parsed.data), { status: 201 });
  }),

  http.patch('/api/tasks/:taskId', async ({ params, request }) => {
    const parsed = taskInputSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return HttpResponse.json({ message: 'Invalid task' }, { status: 400 });
    }
    const task = db.update(String(params.taskId), parsed.data);
    return task
      ? HttpResponse.json(task)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),

  http.delete('/api/tasks/:taskId', ({ params }) =>
    db.find(String(params.taskId))
      ? new HttpResponse(null, { status: 204 })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 }),
  ),
];
