import { baseApi } from '@/api/base-api';
import type { Contact, ContactInput } from '@/features/contacts/model';

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getContacts: build.query<Contact[], void>({
      query: () => 'contacts',
      providesTags: (result = []) => [
        { type: 'Contact', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Contact' as const, id })),
      ],
    }),

    createContact: build.mutation<Contact, ContactInput>({
      query: (body) => ({ url: 'contacts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
  }),
});

export const { useGetContactsQuery, useCreateContactMutation } = contactsApi;
