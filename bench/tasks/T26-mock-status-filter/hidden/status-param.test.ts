import { describe, expect, it } from 'vitest';

describe('T26 status query parameter', () => {
  it('filters by status', async () => {
    const response = await fetch('http://localhost:3000/api/tasks?status=done');
    const tasks = (await response.json()) as { id: string; status: string }[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: '1', status: 'done' });
  });

  it('returns everything without the parameter', async () => {
    const response = await fetch('http://localhost:3000/api/tasks');
    expect((await response.json()) as unknown[]).toHaveLength(3);
  });
});
