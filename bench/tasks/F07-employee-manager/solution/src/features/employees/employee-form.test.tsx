import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmployeeForm } from '@/features/employees/employee-form';
import { renderWithProviders } from '@/test/render';

describe('EmployeeForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<EmployeeForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the values with a null start date when the date is empty', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<EmployeeForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Margaret Hamilton');
    await user.type(screen.getByLabelText('Email'), 'margaret@example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: 'Margaret Hamilton',
      email: 'margaret@example.com',
      department: 'engineering',
      startDate: null,
      managerId: null,
    });
  });
});
