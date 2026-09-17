import { baseApi } from '@/api/base-api';
import type { Project, ProjectInput, ProjectListItem } from '@/features/projects/model';

/** Project endpoints injected into the shared API. Same cache strategy as tasks. */
export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<ProjectListItem[], void>({
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
