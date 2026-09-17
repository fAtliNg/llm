import { useState } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetEmployeesQuery } from '@/features/employees/api';
import { EmployeeList } from '@/features/employees/employee-list';
import { DEPARTMENT_LABELS, DEPARTMENTS, type Department } from '@/features/employees/model';

export function EmployeesPage() {
  const [department, setDepartment] = useState<Department | 'all'>('all');
  const {
    data: employees,
    isLoading,
    isError,
    refetch,
  } = useGetEmployeesQuery(department === 'all' ? undefined : department);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button asChild>
          <Link to="/employees/new">New employee</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="employee-department-filter">Filter by department</Label>
        <Select
          value={department}
          onValueChange={(value) => {
            setDepartment(value as Department | 'all');
          }}
        >
          <SelectTrigger id="employee-department-filter" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {DEPARTMENTS.map((item) => (
              <SelectItem key={item} value={item}>
                {DEPARTMENT_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
