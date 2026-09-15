import { describe, expect, it } from 'vitest';

import { makeStore } from '@/app/store';
import { tasksApi } from '@/features/tasks/api';

describe('tasksApi', () => {
  it('refetches the list after a task is created', async () => {
    const store = makeStore();

    const first = await store.dispatch(tasksApi.endpoints.getTasks.initiate());
    expect(first.data).toHaveLength(3);

    await store
      .dispatch(
        tasksApi.endpoints.createTask.initiate({
          title: 'Fourth',
          description: '',
          status: 'todo',
          priority: 'low',
        }),
      )
      .unwrap();

    // Wait for the invalidated query to settle, then read the cache.
    await store.dispatch(tasksApi.endpoints.getTasks.initiate(undefined, { forceRefetch: true }));
    const state = tasksApi.endpoints.getTasks.select()(store.getState());
    expect(state.data?.map((task) => task.title)).toContain('Fourth');
  });

  it('removes a task after it is deleted', async () => {
    const store = makeStore();
    await store.dispatch(tasksApi.endpoints.getTasks.initiate());

    await store.dispatch(tasksApi.endpoints.deleteTask.initiate('3')).unwrap();

    const result = await store.dispatch(
      tasksApi.endpoints.getTasks.initiate(undefined, { forceRefetch: true }),
    );
    expect(result.data).toHaveLength(2);
    expect(result.data?.map((task) => task.id)).not.toContain('3');
  });
});
