import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteEmployeeButton } from '@/features/employees/delete-employee-button';
import { DEPARTMENT_LABELS, type Employee } from '@/features/employees/model';

export function EmployeeList({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">No employees yet. Add the first one.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{DEPARTMENT_LABELS[employee.department]}</TableCell>
            <TableCell>{employee.startDate ?? '—'}</TableCell>
            <TableCell className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/employees/${employee.id}/edit`} aria-label={`Edit ${employee.name}`}>
                  Edit
                </Link>
              </Button>
              <DeleteEmployeeButton employee={employee} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
