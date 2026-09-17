import { useNavigate } from 'react-router';

import { useCreateEmployeeMutation } from '@/features/employees/api';
import { EmployeeForm } from '@/features/employees/employee-form';
import type { EmployeeInput } from '@/features/employees/model';

export function EmployeeNewPage() {
  const navigate = useNavigate();
  const [createEmployee] = useCreateEmployeeMutation();

  async function handleSubmit(values: EmployeeInput) {
    await createEmployee(values).unwrap();
    await navigate('/employees');
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New employee</h1>
      <EmployeeForm onSubmit={handleSubmit} submitLabel="Create" />
    </section>
  );
}
