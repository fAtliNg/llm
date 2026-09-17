The company has grown and the employees page loads everyone at once. Paginate it on the server.

`GET /api/employees` now returns one page: `{ "items": [...], "total": <number of all employees>, "page": <n>, "pageSize": <n> }`, sorted by name. It accepts `page` (1 or more, default 1) and `pageSize` (1 to 50, default 10); anything else answers 400 with `{ "message": "Invalid pagination" }`. A page beyond the end returns empty `items` with the right `total`. Use SQL limit, offset and count rather than loading every row. Put the schema of the response next to the contract in `shared/employees.ts`.

On the page show ten employees at a time with a pager under the table: the text "Page 1 of 3" between the buttons "Previous" and "Next", which are disabled on the first and the last page. After creating an employee the list and the number of pages are fresh without a reload. Update existing tests where the change requires it and add tests on both sides.
