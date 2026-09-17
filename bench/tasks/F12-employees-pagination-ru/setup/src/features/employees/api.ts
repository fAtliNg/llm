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

    createEmployee: build.mutation<Employee, EmployeeInput>({
      query: (body) => ({ url: 'employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
  }),
});

export const { useGetEmployeesQuery, useCreateEmployeeMutation } = employeesApi;
