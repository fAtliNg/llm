import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetEmployeesQuery } from '@/features/employees/api';
import { EmployeeList } from '@/features/employees/employee-list';

export function EmployeesPage() {
  const { data: employees, isLoading, isError, refetch } = useGetEmployeesQuery();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button asChild>
          <Link to="/employees/new">New employee</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading employees">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load employees</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {employees && <EmployeeList employees={employees} />}
    </section>
  );
}
