import { describe, expect, it } from 'vitest';

describe('T17 mock 404 message', () => {
  it('names the missing task id', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/999');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Task 999 not found' });
  });

  it('still serves existing tasks', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/2');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: '2', title: 'Write the task form' });
  });
});
