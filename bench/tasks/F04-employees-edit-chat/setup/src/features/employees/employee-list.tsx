import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{DEPARTMENT_LABELS[employee.department]}</TableCell>
            <TableCell>{employee.startDate ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
