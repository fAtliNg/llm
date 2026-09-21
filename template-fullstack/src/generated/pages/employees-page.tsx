import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Generated from meta/pages/employees.json by `npm run gen:meta`. Do not edit: change the meta. */
export function EmployeesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Employees</h1>
      <Input data-meta-id="search" placeholder="Search employees" aria-label="Search" />
      <Button data-meta-id="create" variant="outline">
        New employee
      </Button>
      <section
        data-meta-id="employees"
        aria-label="table employees"
        className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
      >
        table "employees" is not generated yet
      </section>
    </section>
  );
}
