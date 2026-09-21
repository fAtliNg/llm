# The meta folder

The JSON objects are **meta**: data about the app, from which the app is built. They live in the app itself, in `meta/`, one file per object, one folder per object type:

```
meta/
├── pages/
│   ├── employees.json
│   └── employee-new.json
├── tables/
│   └── employees.json
├── forms/
│   └── employee.json
└── panels/
    └── employee-summary.json
```

## Rules

- **File name is the id.** `meta/tables/employees.json` is the object with `"id": "employees"`, and a reference from another object is just that id. Ids are unique within a folder; the folder tells the type, so a page and a table may both be called `employees`.
- **One object per file.** Small files are what the model reads and edits reliably; a change to one form touches one file.
- **The folder tells the type.** `type` inside the file must agree with the folder it is in; a mismatch is an error.
- **Meta is source, not output.** It is committed, reviewed in diffs and regenerated from on demand with `npm run gen:meta`. Generated code lands in `src/generated/`, which the generator owns and rewrites; generated code never edits meta.
- **Fields have no files of their own.** A field exists only inside the `fields` of its container.

## Why here, and not elsewhere

Considered and set aside:

- *Next to the generated code* (`src/features/employees/…`): one object drives both the web app and the API, so it does not belong to either folder.
- *One file for the whole app*: every change becomes an edit to a large file, the case where a small model misses most often.
- *In the database, edited at runtime*: a different product (a runtime builder); it gives up plain generated code, `tsc` and `verify` as the safety net.

::: info Open
JSON or TypeScript for the files. JSON is data and keeps logic out of meta; TypeScript would let `tsc` check `props` against each component for free. With JSON, a JSON Schema generated from the component types does that check instead.
:::
