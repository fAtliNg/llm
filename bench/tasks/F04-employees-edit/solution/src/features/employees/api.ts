import { baseApi } from '@/api/base-api';
import type { Employee, EmployeeInput } from '@/features/employees/model';

/** Employee endpoints injected into the shared API. Same cache strategy as tasks. */
export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Employee[], void>({
      query: () => 'employees',
      providesTags: (result = []) => [
        { type: 'Employee', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Employee' as const, id })),
      ],
    }),

    getEmployee: build.query<Employee, string>({
      query: (id) => `employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: build.mutation<Employee, EmployeeInput>({
      query: (body) => ({ url: 'employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    updateEmployee: build.mutation<Employee, { id: string; patch: Partial<EmployeeInput> }>({
      query: ({ id, patch }) => ({ url: `employees/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employee', id }],
    }),

    deleteEmployee: build.mutation<void, string>({
      query: (id) => ({ url: `employees/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
