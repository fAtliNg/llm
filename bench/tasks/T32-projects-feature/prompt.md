Add a Projects section to the app. Users need:

- a list of projects at `/projects` showing each project's name and deadline (empty cell when there is none), reachable through a "Projects" link in the main navigation;
- a way to add a project at `/projects/new`: a form with a "Name" field (required) and a "Deadline" field (an `<input type="date">`, optional) and a "Create" button; after creating, return to the projects list where the new project appears.

Follow the same layering as the tasks feature, including the mock API at `/api/projects` backed by the in-memory db.
