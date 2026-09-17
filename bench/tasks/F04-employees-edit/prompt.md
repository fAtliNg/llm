Employees can be created but not changed. Add an "Edit" link to every row of the employees table (accessible name "Edit <name>") that opens `/employees/:employeeId/edit`: a page with the heading "Edit employee", the form filled with the employee's values and a "Save" button that brings the user back to the list. An unknown id shows "Employee not found".

Add a "Delete" button to every row (accessible name "Delete <name>") behind a confirmation dialog titled "Delete employee?", the same way tasks are deleted; after confirming, the employee disappears from the list.

When the API answers 409 because the email belongs to another employee, stay on the form and show the message from the API, "An employee with this email already exists", under the Email field. This applies to the create page too. The API already supports everything needed. Add tests.
