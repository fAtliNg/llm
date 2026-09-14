Add an optional due date to tasks.

- Extend the task model with an optional `dueDate`: an ISO date string (`YYYY-MM-DD`). Absent or empty means unset. Existing tasks, mock data and API calls without a due date must keep working.
- Add a "Due date" field to the task form: an `<input type="date">` with the label text exactly "Due date". It is optional.
- Show the due date in the tasks table in a new "Due date" column, empty when unset.

Update existing tests if the change requires it.
