import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/mocks/server';
import { renderApp } from '@/test/render';

describe('F03 department filter in the web app', () => {
  it('asks the server for the chosen department and shows everyone again with All', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get('*/api/employees', ({ request }) => {
        const department = new URL(request.url).searchParams.get('department');
        seen.push(department);
        const all = [
          {
            id: 'a',
            name: 'Bench Pi-415',
            email: 'pi-415@bench.test',
            department: 'sales',
            startDate: null,
          },
          {
            id: 'b',
            name: 'Bench Rho-972',
            email: 'rho-972@bench.test',
            department: 'design',
            startDate: null,
          },
        ];
        return HttpResponse.json(
          department ? all.filter((item) => item.department === department) : all,
        );
      }),
    );

    const { user } = renderApp(['/employees']);
    expect(await screen.findByText('Bench Pi-415')).toBeInTheDocument();
    expect(screen.getByText('Bench Rho-972')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Filter by department' }));
    await user.click(await screen.findByRole('option', { name: 'Design' }));
    await waitFor(() => {
      expect(screen.queryByText('Bench Pi-415')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Bench Rho-972')).toBeInTheDocument();
    expect(seen).toContain('design');

    await user.click(screen.getByRole('combobox', { name: 'Filter by department' }));
    await user.click(await screen.findByRole('option', { name: 'All' }));
    expect(await screen.findByText('Bench Pi-415')).toBeInTheDocument();
  });
});
