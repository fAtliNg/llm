import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Single RTK Query API for the whole app. Features add their endpoints with
 * `baseApi.injectEndpoints(...)` so the store, middleware and cache stay unified.
 *
 * Add every entity tag here; endpoints reference them for cache invalidation.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL ?? '/api' }),
  tagTypes: ['Task', 'Invoice'],
  endpoints: () => ({}),
});
