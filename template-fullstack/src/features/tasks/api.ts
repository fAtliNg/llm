import { baseApi } from '@/api/base-api';
import type { Task, TaskInput } from '@/features/tasks/model';

/**
 * Task endpoints injected into the shared API.
 *
 * Cache strategy: every task is tagged by id, and the collection is tagged with
 * the sentinel id 'LIST'. Mutations invalidate exactly what they change.
 */
export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<Task[], void>({
      query: () => 'tasks',
      providesTags: (result = []) => [
        { type: 'Task', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Task' as const, id })),
      ],
    }),

    getTask: build.query<Task, string>({
      query: (id) => `tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),

    createTask: build.mutation<Task, TaskInput>({
      query: (body) => ({ url: 'tasks', method: 'POST', body }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    updateTask: build.mutation<Task, { id: string; patch: Partial<TaskInput> }>({
      query: ({ id, patch }) => ({ url: `tasks/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }],
    }),

    deleteTask: build.mutation<void, string>({
      query: (id) => ({ url: `tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
