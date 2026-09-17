We want to see who reports to whom. Every employee may have a manager, who is another employee.

Add `managerId` to employees through the whole stack: the id of another employee or null. In the seed the second employee reports to the first. The employee form gets a select labelled "Manager" with "No manager" chosen by default and one option per existing employee, by name. The employees table gets a "Manager" column with the manager's name or "—".

The API must not store nonsense: a `managerId` that does not belong to an existing employee answers 400 with `{ "message": "Unknown manager" }`, and a PATCH that makes an employee their own manager answers 400 with `{ "message": "An employee cannot manage themselves" }`. Deleting a manager must keep working: their reports simply end up without a manager (`managerId` becomes null).

Contract first, then the table with a migration, the API, the form and the list. Existing employees and tests keep working; update existing tests where the change requires it and cover the new behaviour on both sides.
