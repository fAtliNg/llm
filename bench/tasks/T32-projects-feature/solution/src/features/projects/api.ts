import { baseApi } from '@/api/base-api';
import type { Project, ProjectInput } from '@/features/projects/model';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      query: () => 'projects',
      providesTags: (result = []) => [
        { type: 'Project', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Project' as const, id })),
      ],
    }),

    createProject: build.mutation<Project, ProjectInput>({
      query: (body) => ({ url: 'projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const { useGetProjectsQuery, useCreateProjectMutation } = projectsApi;
