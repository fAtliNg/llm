import { baseApi } from '@/api/base-api';
import type { Employee, EmployeeInput, EmployeePage } from '@/features/employees/model';

/** Employee endpoints injected into the shared API. Same cache strategy as tasks. */
export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** One page, sorted by name on the server. Every page depends on the LIST tag. */
    getEmployees: build.query<EmployeePage, { page: number; pageSize?: number }>({
      query: (params) => ({ url: 'employees', params }),
      providesTags: (result) => [
        { type: 'Employee', id: 'LIST' },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Employee' as const, id })),
      ],
    }),

    createEmployee: build.mutation<Employee, EmployeeInput>({
      query: (body) => ({ url: 'employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
  }),
});

export const { useGetEmployeesQuery, useCreateEmployeeMutation } = employeesApi;
