import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render';

describe('EmployeesPage', () => {
  it('opens at /employees with its heading and fields', () => {
    renderApp(['/employees']);

    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    for (const id of ['search', 'create', 'employees'])
      expect(screen.getByTestId(id)).toBeInTheDocument();
  });
});
