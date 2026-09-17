import { useNavigate, useParams } from 'react-router';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetEmployeeQuery, useUpdateEmployeeMutation } from '@/features/employees/api';
import { EmployeeForm } from '@/features/employees/employee-form';
import type { EmployeeInput } from '@/features/employees/model';

export function EmployeeEditPage() {
  const { employeeId = '' } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const {
    data: employee,
    isLoading,
    isError,
  } = useGetEmployeeQuery(employeeId, { skip: employeeId === '' });
  const [updateEmployee] = useUpdateEmployeeMutation();

  async function handleSubmit(values: EmployeeInput) {
    await updateEmployee({ id: employeeId, patch: values }).unwrap();
    await navigate('/employees');
  }

  if (isLoading) {
    return <Skeleton className="h-64 max-w-lg" aria-label="Loading employee" />;
  }

  if (isError || !employee) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Employee not found</AlertTitle>
      </Alert>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit employee</h1>
      <EmployeeForm defaultValues={employee} onSubmit={handleSubmit} />
    </section>
  );
}
