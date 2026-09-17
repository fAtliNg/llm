The employees list is getting long. Add a select labelled "Filter by department" above the table with "All" selected by default and one option per department. Picking a department shows only its employees; "All" shows everyone again.

The filtering must happen on the server: `GET /api/employees?department=design` returns only that department, without the parameter everyone is returned, and an unknown department answers 400 with `{ "message": "Invalid department" }`. Add tests on both sides.
