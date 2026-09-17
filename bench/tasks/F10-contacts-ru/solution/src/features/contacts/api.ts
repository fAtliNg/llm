import { baseApi } from '@/api/base-api';
import type { Contact, ContactInput, ContactPatch } from '@/features/contacts/model';

/** Contact endpoints injected into the shared API. Same cache strategy as tasks. */
export const contactsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** The argument is the search text; an empty string lists everyone. */
    getContacts: build.query<Contact[], string>({
      query: (q) => ({ url: 'contacts', params: q ? { q } : undefined }),
      providesTags: (result = []) => [
        { type: 'Contact', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Contact' as const, id })),
      ],
    }),

    createContact: build.mutation<Contact, ContactInput>({
      query: (body) => ({ url: 'contacts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /** Also refreshes the list: favourites are sorted first on the server. */
    updateContact: build.mutation<Contact, { id: string; patch: ContactPatch }>({
      query: ({ id, patch }) => ({ url: `contacts/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetContactsQuery, useCreateContactMutation, useUpdateContactMutation } =
  contactsApi;
