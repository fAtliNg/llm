import { baseApi } from '@/api/base-api';
import type { Invoice, InvoiceInput } from '@/features/invoices/model';

/** Invoice endpoints injected into the shared API. Same cache strategy as tasks. */
export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInvoices: build.query<Invoice[], void>({
      query: () => 'invoices',
      providesTags: (result = []) => [
        { type: 'Invoice', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Invoice' as const, id })),
      ],
    }),

    createInvoice: build.mutation<Invoice, InvoiceInput>({
      query: (body) => ({ url: 'invoices', method: 'POST', body }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),

    sendInvoice: build.mutation<Invoice, string>({
      query: (id) => ({ url: `invoices/${id}/send`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),

    payInvoice: build.mutation<Invoice, string>({
      query: (id) => ({ url: `invoices/${id}/pay`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useSendInvoiceMutation,
  usePayInvoiceMutation,
} = invoicesApi;
