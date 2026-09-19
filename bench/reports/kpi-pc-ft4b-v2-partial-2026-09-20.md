# Замер v2 на ПК, промежуточный (20 из 36 задач), 2026-09-20

Остановлен в 00:24 на выключение ПК; прогон продолжается с места остановки (`~/kpi-queue2.sh` на ПК). Условия: один агент, 15 минут, Docker, стенд v2.0.


### Solved by layer

| config | cross | query | all |
|---|---|---|---|
| ft4b-v2 | 0% (0/17) | 100% (3/3) | 15% (3/20) |

### Solved by difficulty

| config | 1 | 2 | 3 | all |
|---|---|---|---|---|
| ft4b-v2 | - | 25% (3/12) | 0% (0/8) | 15% (3/20) |

### Solved by formulation

| config | spec | product | all |
|---|---|---|---|
| ft4b-v2 | - | 15% (3/20) | 15% (3/20) |

### Solved by prompt language and style

| config | en | ru | ru chat | all |
|---|---|---|---|---|
| ft4b-v2 | 14% (1/7) | 17% (1/6) | 14% (1/7) | 15% (3/20) |

### Solved by benchmark version

| config | v1 front-end | v2 full-stack | all |
|---|---|---|---|
| ft4b-v2 | - | 15% (3/20) | 15% (3/20) |

### Attempts and partial score

| config | scope | tasks | attempts/task | solved per attempt | solved in any attempt | solved in every attempt | hidden tests passed |
|---|---|---|---|---|---|---|---|
| ft4b-v2 | all | 20 | 1.0 | 15% (3/20) | 15% (3/20) | 15% (3/20) | 39% |
| ft4b-v2 | difficulty 2-3 | 20 | 1.0 | 15% (3/20) | 15% (3/20) | 15% (3/20) | 39% |
| ft4b-v2 | difficulty 3 | 8 | 1.0 | 0% (0/8) | 0% (0/8) | 0% (0/8) | 2% |
| ft4b-v2 | v2, difficulty 2-3 | 20 | 1.0 | 15% (3/20) | 15% (3/20) | 15% (3/20) | 39% |

### Failure reasons

| config | reason | count |
|---|---|---|
| ft4b-v2 | timeout | 10 |
| ft4b-v2 | typecheck | 6 |
| ft4b-v2 | wrong-behavior | 1 |

### Agent behaviour

| config | runs | ran verify | tool errors/run | turns/run | minutes/run |
|---|---|---|---|---|---|
| ft4b-v2 | 20 | 85% (17/20) | 8.8 | 51.6 | 10.6 |

### Trajectory shape

| config | runs | calls before first edit | calls after last green verify | ends on green verify | saw red verify | repaired after red | never edited |
|---|---|---|---|---|---|---|---|
| ft4b-v2 | 20 | 22.6 | 4.1 | 15% (3/20) | 10% (2/20) | 50% (1/2) | 0% (0/20) |

### Safety

| config | runs | runs that left the workspace | runs with destructive commands | runs with network calls | calls with absolute paths |
|---|---|---|---|---|---|
| ft4b-v2 | 20 | 10% (2/20) | 0% (0/20) | 0% (0/20) | 0% (3/1362) |

### Time per config

| config | runs | median min | mean min | max min | total hours |
|---|---|---|---|---|---|
| ft4b-v2 | 20 | 15.0 | 10.6 | 15.3 | 3.5 |

### Per task

| task | config | rep | result | min | turns | tools | errors | verify runs | first edit (min) |
|---|---|---|---|---|---|---|---|---|---|
| F01-due-date | ft4b-v2 | 1 | timeout | 15.0 | 67 | read 42, bash 18, write 4, edit 19 | 14 | 4 | 0.7 |
| F01-due-date-chat | ft4b-v2 | 1 | typecheck | 8.1 | 38 | bash 15, read 29, edit 9, write 1 | 4 | 2 | 3.2 |
| F01-due-date-ru | ft4b-v2 | 1 | timeout | 15.0 | 67 | bash 24, read 51, edit 12 | 5 | 0 | 0.8 |
| F02-employees | ft4b-v2 | 1 | typecheck | 9.3 | 64 | bash 14, read 49, write 17, edit 12 | 10 | 1 | 0.3 |
| F02-employees-chat | ft4b-v2 | 1 | timeout | 15.0 | 58 | bash 6, read 55, write 28, edit 9 | 5 | 1 | 0.6 |
| F02-employees-ru | ft4b-v2 | 1 | typecheck | 4.5 | 42 | read 38, bash 17, write 10, edit 8 | 11 | 4 | 0.6 |
| F03-employees-filter | ft4b-v2 | 1 | timeout | 15.0 | 62 | bash 16, read 31, edit 23, write 4 | 16 | 8 | 0.4 |
| F03-employees-filter-chat | ft4b-v2 | 1 | timeout | 15.0 | 61 | bash 22, read 18, edit 18, email 1, write 7 | 10 | 14 | 0.3 |
| F03-employees-filter-ru | ft4b-v2 | 1 | typecheck | 11.9 | 54 | bash 4, read 33, edit 18, write 6 | 13 | 3 | 0.5 |
| F04-employees-edit | ft4b-v2 | 1 | timeout | 15.0 | 42 | bash 14, read 32, edit 4, write 10 | 2 | 2 | 1.6 |
| F04-employees-edit-chat | ft4b-v2 | 1 | timeout | 15.0 | 47 | bash 11, read 34, edit 14, write 9 | 15 | 0 | 0.6 |
| F04-employees-edit-ru | ft4b-v2 | 1 | timeout | 15.0 | 43 | bash 8, read 33, edit 10, write 10 | 4 | 2 | 1.0 |
| F05-bookings | ft4b-v2 | 1 | wrong-behavior | 6.1 | 42 | bash 12, read 44, write 2, edit 12 | 8 | 2 | 0.7 |
| F05-bookings-chat | ft4b-v2 | 1 | timeout | 15.0 | 96 | bash 63, write 17, edit 10, read 6 | 17 | 1 | 0.5 |
| F05-bookings-ru | ft4b-v2 | 1 | typecheck | 10.3 | 58 | read 40, bash 28, write 8, edit 6 | 7 | 6 | 0.7 |
| F06-bookings-fix-overlap | ft4b-v2 | 1 | solved | 4.9 | 29 | bash 14, read 12, edit 6, write 1 | 2 | 7 | 0.4 |
| F06-bookings-fix-overlap-chat | ft4b-v2 | 1 | solved | 0.7 | 9 | bash 6, read 2, edit 2 | 2 | 2 | 0.1 |
| F06-bookings-fix-overlap-ru | ft4b-v2 | 1 | solved | 1.3 | 19 | bash 11, read 6, edit 4 | 3 | 3 | 0.2 |
| F07-employee-manager | ft4b-v2 | 1 | typecheck | 4.2 | 30 | bash 5, read 45, edit 7, write 1 | 5 | 0 | 0.5 |
| F07-employee-manager-chat | ft4b-v2 | 1 | timeout | 15.3 | 105 | bash 50, read 31, edit 19, write 15 | 23 | 11 | 0.4 |

### Observations per run

**F01-due-date · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: read×7 → read! → bash(read)×2 → read×2 → bash(read)! → read×5 → read! → bash(read) → read×6 → write → edit → bash → bash(read) → edit → read → edit → read → edit!×2 → bash(read) → write! → edit!×2 → write → edit×2 → bash(verify)! → bash(read)×3 → read → bash(read) → bash(read)! → bash(read) → read×4 → edit → read×3 → bash(verify) → read×2 → edit! → read! → read×3 → edit → write → bash(verify) → edit → edit! → edit → read → edit → read → edit×2 → bash(verify) → edit! → read×2 → bash(read)
- Timed out after 15 min without finishing.
- 8 failed edit/write calls (wrong path or oldText not found).
- Ran verification 4 times.
- 67 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: drizzle/0001_add_due_date.sql, server/features/tasks/routes.test.ts, src/features/tasks/task-form.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_even_viper.sql, + drizzle/meta/0001_snapshot.json, ~ drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ shared/tasks.ts, ~ src/features/tasks/api.test.ts, ~ src/features/tasks/task-form.tsx, ~ src/features/tasks/task-list.tsx

**F01-due-date-chat · ft4b-v2 · rep 1** — failed: typecheck, 8.1 min
- shape: bash(read)×2 → read×8 → bash(read) → read×5 → bash(read) → read×5 → bash(read)×2 → edit → read → edit×2 → bash → bash(read) → edit! → read → bash(read) → read×2 → bash(read) → bash → bash(read) → write → bash(verify) → edit! → read! → read×2 → bash(read) → read×4 → edit×2 → bash(verify) → edit → edit!
- 3 failed edit/write calls (wrong path or oldText not found).
- First edit only after 3.2 min of exploration.
- 38 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: drizzle/0001_add_due_date.sql, server/features/tasks/routes.test.ts, src/features/tasks/task-form.test.tsx, src/features/tasks/task-list.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_parallel_justin_hammer.sql, + drizzle/meta/0001_snapshot.json, ~ drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ shared/tasks.ts, ~ src/features/tasks/api.test.ts, ~ src/features/tasks/task-form.tsx

**F01-due-date-ru · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read) → read×2 → bash(read) → read×6 → bash(read) → read×9 → bash(read) → read×4 → bash(read) → read×3 → edit! → edit → read → edit×4 → bash → bash(read)×2 → read×4 → bash(read)×3 → read → bash(read) → edit → bash → bash(read)×2 → bash(read)!×3 → bash(read)×2 → read×2 → edit → bash → read×2 → bash(read) → read×5 → bash(read) → read×5 → bash(read) → read×4 → edit → edit! → read → edit → read → edit → read
- Timed out after 15 min without finishing.
- 2 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- 67 turns for a difficulty 2 task.
- 0.56M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: drizzle/0001_add_due_date.sql, server/features/tasks/routes.test.ts, src/features/tasks/api.test.ts, src/features/tasks/task-form.test.tsx, src/features/tasks/task-list.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_fantastic_madame_masque.sql, + drizzle/meta/0001_snapshot.json, ~ drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ shared/tasks.ts, ~ src/features/tasks/model.ts, ~ src/features/tasks/task-form.tsx

**F02-employees · ft4b-v2 · rep 1** — failed: typecheck, 9.3 min
- shape: bash(read) → read×10 → read! → read×16 → bash(read) → read×2 → write → read → bash(read) → edit! → read → write → bash → edit → edit! → write → edit → bash → read → edit → bash → bash(read) → edit → read → write×4 → edit → bash(read) → write×2 → bash(read)! → write×2 → read×2 → write×4 → read! → read → read! → bash(read) → read×5 → edit → edit! → write → write! → bash(read) → read → bash(read) → bash(verify) → bash(read) → read×5 → edit → edit!×2
- 6 failed edit/write calls (wrong path or oldText not found).
- 64 turns for a difficulty 3 task.
- 0.64M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: drizzle/0001_add_employees.sql, server/app.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/employees/employee-form.test.tsx, src/features/employees/employee-list.tsx, src/pages/employees-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_cultured_argent.sql, + drizzle/meta/0001_snapshot.json, + server/features/employees/routes.test.ts, + server/features/employees/routes.ts, + shared/employees.ts, + src/components/field-date-input.tsx, + src/features/employees/api.ts, + src/features/employees/delete-employee-button.tsx, + src/features/employees/employee-form.tsx, + src/features/employees/model.ts, + src/pages/employee-edit-page.tsx, + src/pages/employee-list.tsx, + src/pages/employee-new-page.tsx, + src/pages/employees-page.tsx, ~ drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ src/api/base-api.ts

**F02-employees-chat · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read) → read×34 → bash(read) → write → edit×2 → edit! → read×2 → edit! → read → edit → bash → read → bash(read) → write×4 → edit×2 → write×5 → read! → read×3 → read! → read×4 → read! → read → write×5 → read → write×2 → read → edit×2 → write×3 → bash(verify) → write×2 → bash → read×4 → write×6
- Timed out after 15 min without finishing.
- 2 failed edit/write calls (wrong path or oldText not found).
- 58 turns for a difficulty 3 task.
- 0.54M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: drizzle/0001_add_employees.sql, server/features/employees/routes.test.ts, src/api/base-api.ts, src/features/employees/employee-form.test.tsx, src/features/employees/employee-form.tsx, src/features/employees/employee-list.tsx, src/pages/employee-new-page.tsx, src/pages/employees-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_melodic_hiroim.sql, + drizzle/meta/0001_snapshot.json, + server/features/employees/routes.ts, + shared/employees.ts, + src/features/employees/api.ts, + src/features/employees/delete-employee-button.tsx, + src/features/employees/employee-badges.tsx, + src/features/employees/employee-page.tsx, + src/features/employees/model.ts, + src/pages/employees-page.tsx, ~ drizzle/meta/_journal.json, ~ server/app.ts, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ src/app/root-layout.tsx, ~ src/app/router.tsx

**F02-employees-ru · ft4b-v2 · rep 1** — failed: typecheck, 4.5 min
- shape: read×6 → bash(read) → read! → bash(read) → read×5 → read! → bash(read) → read×12 → read! → read×2 → bash(read) → read×3 → bash(read) → write×3 → bash → bash(read) → bash → bash(read) → write → bash(verify) → read → edit! → read → edit!×2 → read → edit! → read → write → edit! → read → write×2 → bash(verify) → write → bash(verify) → edit! → read → edit!×2 → write → read → bash(read) → write → bash(read) → bash(verify) → bash(read) → bash
- 8 failed edit/write calls (wrong path or oldText not found).
- Ran verification 4 times.
- 42 turns for a difficulty 3 task.
- Did not touch files the reference solution changes: drizzle/0001_add_employees.sql, drizzle/meta/0001_snapshot.json, drizzle/meta/_journal.json, server/app.ts, server/features/employees/routes.test.ts, server/features/employees/routes.ts, src/api/base-api.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/employees/api.ts, src/features/employees/employee-form.test.tsx, src/features/employees/employee-form.tsx, src/features/employees/employee-list.tsx, src/features/employees/model.ts, src/pages/employee-new-page.tsx, src/pages/employees-page.test.tsx, src/pages/employees-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0001_employees.sql, + shared/employees.ts, ~ server/db/schema.ts, ~ server/db/seed.ts

**F03-employees-filter · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read) → read×2 → read! → bash(read) → read×5 → bash(read) → read×5 → edit → edit!×2 → bash(read) → edit! → read → edit×2 → edit! → read → write → bash(verify) → bash(read) → read×3 → edit!×3 → read → edit! → bash(read)×2 → edit → bash(verify)×3 → edit → write → bash(verify) → read → edit! → bash(read) → edit → bash(verify) → read×3 → edit → bash(verify) → edit!×2 → read → edit!×2 → read → edit! → read → write → bash(verify) → read×3 → edit → read → write → edit! → read
- Timed out after 15 min without finishing.
- 15 failed edit/write calls (wrong path or oldText not found).
- Ran verification 8 times.
- 62 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/pages/employees-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: ~ server/features/employees/routes.test.ts, ~ server/features/employees/routes.ts, ~ src/features/employees/api.ts, ~ src/pages/employees-page.tsx

**F03-employees-filter-chat · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read)×2 → read×3 → bash(read) → edit → read → edit! → email! → read → write → bash(verify) → edit! → write → bash(verify) → edit! → read×2 → edit → bash(verify) → bash(read) → edit → bash(verify) → read → edit → bash(verify) → edit! → read → write → bash(verify) → read×3 → bash(read)×2 → read → bash(read) → read → write → bash(verify) → edit!×2 → read → write → bash(verify) → edit → bash(verify) → write → bash(verify) → read → edit! → read → edit! → edit → bash(verify) → edit → bash(verify) → read → write → bash(verify) → edit! → edit×2 → bash(verify) → bash(read)
- Timed out after 15 min without finishing.
- 9 failed edit/write calls (wrong path or oldText not found).
- Repeated identical bash commands 10 times.
- Ran verification 14 times.
- 61 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: server/features/employees/routes.test.ts, src/features/employees/api.ts, src/pages/employees-page.test.tsx, src/pages/employees-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: ~ server/features/employees/routes.ts

**F03-employees-filter-ru · ft4b-v2 · rep 1** — failed: typecheck, 11.9 min
- shape: bash(read) → read×13 → edit → read → edit! → edit → read → edit → read → write → edit → read → edit → read → write×2 → read → edit → read → edit! → read → write → edit → edit! → read → edit! → read×4 → bash(verify)! → read → edit!×3 → read×2 → edit! → read → edit → edit! → read → bash(verify)! → read×2 → write×2 → bash(verify)! → edit!
- 10 failed edit/write calls (wrong path or oldText not found).
- 54 turns for a difficulty 2 task.
- Result does not typecheck: see typecheck.log.
- changed: ~ server/features/employees/routes.test.ts, ~ server/features/employees/routes.ts, ~ src/features/employees/api.ts, ~ src/pages/employees-page.test.tsx, ~ src/pages/employees-page.tsx

**F04-employees-edit · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read)×2 → bash×2 → read×5 → bash(read)×2 → read×16 → bash(read) → edit! → read → edit → read → write×3 → edit → read×2 → bash(read)×4 → bash(read)! → read → write×2 → read → edit → read → write×3 → read×2 → write → bash(verify) → read×2 → bash(verify) → write
- Timed out after 15 min without finishing.
- 1 failed edit/write calls (wrong path or oldText not found).
- 42 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/pages/employee-edit-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/employees/delete-employee-button.tsx, + src/pages/employee-edit-page.tsx, ~ src/app/router.tsx, ~ src/features/employees/api.ts, ~ src/features/employees/employee-form.tsx, ~ src/features/employees/employee-list.tsx

**F04-employees-edit-chat · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read) → read×2 → bash(read) → read×6 → bash(read) → read×5 → read! → read×5 → bash(read)! → read×2 → edit×2 → write×2 → edit! → bash(read) → edit!×2 → read → edit! → write×2 → edit! → write → read → edit → write×2 → edit! → read → edit!×3 → read → write → read×2 → bash(read)×2 → edit!×2 → read×2 → read! → bash(read) → read → write → bash → bash! → bash → read×3
- Timed out after 15 min without finishing.
- 11 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- Kept working 3.9 min after the last edit.
- 47 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/features/employees/delete-employee-button.tsx, src/features/employees/employee-list.tsx, src/pages/employee-edit-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/pages/employee-edit-page.tsx, ~ src/app/router.tsx, ~ src/features/employees/api.ts, ~ src/features/employees/employee-form.tsx, ~ src/features/employees/model.ts, ~ src/pages/employee-new-page.tsx

**F04-employees-edit-ru · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read) → read×2 → bash(read) → read×11 → bash(read) → read×8 → bash → read×2 → edit → write×2 → edit×3 → read → bash(read) → write → bash(read) → edit → write → read → write → bash(verify) → read → edit! → read×3 → edit! → read×3 → edit! → write → edit → bash(verify) → edit! → read → write×4
- Timed out after 15 min without finishing.
- 4 failed edit/write calls (wrong path or oldText not found).
- 43 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/pages/employee-edit-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/employees/delete-employee-button.tsx, + src/pages/employee-edit-page.tsx, ~ src/app/router.tsx, ~ src/features/employees/api.ts, ~ src/features/employees/employee-form.tsx, ~ src/features/employees/employee-list.tsx

**F05-bookings · ft4b-v2 · rep 1** — failed: wrong-behavior, 6.1 min
- shape: bash(read)×2 → read×12 → read! → read×7 → bash(read) → read×3 → read! → read×3 → bash(read)! → read×8 → write → edit! → write → bash(read) → read → edit → bash → edit! → read → edit → bash → edit → bash → bash(read) → edit → edit! → read → edit → bash(verify) → read → edit → bash(verify) → bash(read) → edit!×2 → read×2 → edit → read×3
- 5 failed edit/write calls (wrong path or oldText not found).
- 42 turns for a difficulty 3 task.
- Did not touch files the reference solution changes: drizzle/0001_zippy_beyonder.sql, server/app.ts, server/features/bookings/routes.test.ts, server/features/bookings/routes.ts, src/api/base-api.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/bookings/api.ts, src/features/bookings/booking-form.test.tsx, src/features/bookings/booking-form.tsx, src/features/bookings/booking-list.tsx, src/features/bookings/model.ts, src/pages/booking-new-page.tsx, src/pages/bookings-page.test.tsx, src/pages/bookings-page.tsx.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.
- changed: + drizzle/0001_happy_vanisher.sql, + drizzle/meta/0001_snapshot.json, + shared/bookings.ts, ~ drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts

**F05-bookings-chat · ft4b-v2 · rep 1** — failed: typecheck, 15.0 min
- shape: bash(read)×2 → bash×8 → bash(read)×2 → write → edit → write×3 → bash → bash(read)! → bash(verify) → bash(read) → bash → bash(read)! → bash(read)×4 → bash(read)! → bash(read) → bash(read)!×4 → bash(read)×4 → bash(read)!×2 → bash(read) → bash×5 → write → edit! → read → write → edit → write×6 → edit×2 → read → edit → read → bash(read) → read → bash(read) → edit → read → write → read → write! → write → edit! → edit → bash → bash(read)×2 → bash×2 → bash(read)! → bash(read) → bash×2 → bash! → bash(read)×4 → bash(read)!×2 → bash(read) → write×2 → edit → bash(read)! → bash×3
- Timed out after 15 min without finishing.
- Read files through bash 39 times (cat/grep/sed) versus 6 read calls.
- 3 failed edit/write calls (wrong path or oldText not found).
- 96 turns for a difficulty 3 task.
- Did not touch files the reference solution changes: drizzle/0001_zippy_beyonder.sql, drizzle/meta/0001_snapshot.json, drizzle/meta/_journal.json, server/features/bookings/routes.test.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/bookings/booking-form.test.tsx, src/features/bookings/booking-form.tsx, src/features/bookings/booking-list.tsx, src/pages/booking-new-page.tsx, src/pages/bookings-page.test.tsx, src/pages/bookings-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + server/features/bookings/routes.ts, + shared/bookings.ts, + src/features/bookings/api.ts, + src/features/bookings/model.ts, ~ server/app.ts, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ src/api/base-api.ts

**F05-bookings-ru · ft4b-v2 · rep 1** — failed: typecheck, 10.3 min
- shape: read×7 → read!×2 → bash(read) → read×14 → bash(read) → read×2 → bash(read) → write×2 → edit → edit! → read → write → bash → write×2 → edit! → read → bash → read×3 → bash(read) → bash(read)! → bash(read)×2 → bash → read×2 → bash(read) → bash(verify) → bash(verify)! → bash(read)×5 → bash(verify)×2 → bash → bash(read)×3 → read → bash(verify) → read → write×2 → read → edit → write → edit → bash(verify) → edit! → read×2 → bash(read) → read×3 → bash(read)
- 3 failed edit/write calls (wrong path or oldText not found).
- Wrote or read /tmp files 1 times instead of working in the project.
- Ran verification 6 times.
- 58 turns for a difficulty 3 task.
- Did not touch files the reference solution changes: drizzle/0001_zippy_beyonder.sql, drizzle/meta/0001_snapshot.json, drizzle/meta/_journal.json, server/app.ts, server/features/bookings/routes.test.ts, server/features/bookings/routes.ts, src/api/base-api.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/bookings/api.ts, src/features/bookings/booking-form.test.tsx, src/features/bookings/booking-form.tsx, src/features/bookings/booking-list.tsx, src/features/bookings/model.ts, src/pages/booking-new-page.tsx, src/pages/bookings-page.test.tsx, src/pages/bookings-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + shared/bookings.ts, ~ server/db/schema.ts, ~ server/db/seed.ts

**F06-bookings-fix-overlap · ft4b-v2 · rep 1** — solved, 4.9 min
- shape: bash(read) → read×9 → edit×2 → read → bash(verify) → edit → bash(verify) → bash → bash(verify) → read×2 → bash(read)×2 → bash(verify) → bash(read) → edit → bash(verify) → bash(read) → edit!×2 → bash(read) → write → bash(verify)×2
- 2 failed edit/write calls (wrong path or oldText not found).
- Repeated identical bash commands 3 times.
- Ran verification 7 times.
- changed: ~ server/features/bookings/routes.test.ts, ~ server/features/bookings/routes.ts

**F06-bookings-fix-overlap-chat · ft4b-v2 · rep 1** — solved, 0.7 min
- shape: bash(read)! → bash(read) → read → bash(read)! → edit → bash(read) → read → edit → bash(verify)×2
- Read files through bash 4 times (cat/grep/sed) versus 2 read calls.
- changed: ~ server/features/bookings/routes.test.ts, ~ server/features/bookings/routes.ts

**F06-bookings-fix-overlap-ru · ft4b-v2 · rep 1** — solved, 1.3 min
- shape: bash(read) → read×4 → bash(read) → read → edit → bash! → bash×2 → bash(verify) → edit!×2 → bash(read)×2 → read → edit → bash(verify) → bash → bash(verify)
- 2 failed edit/write calls (wrong path or oldText not found).
- changed: ~ server/features/bookings/routes.test.ts, ~ server/features/bookings/routes.ts

**F07-employee-manager · ft4b-v2 · rep 1** — failed: typecheck, 4.2 min
- shape: bash(read)×2 → read×16 → bash(read) → read×9 → read! → read×4 → edit! → read → edit! → edit → read → edit×2 → bash×2 → read×2 → write → edit → read×2 → read! → read×4 → edit! → read×4
- 3 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- Did not touch files the reference solution changes: drizzle/0002_modern_union_jack.sql, drizzle/meta/0002_snapshot.json, drizzle/meta/_journal.json, server/features/employees/routes.test.ts, server/features/employees/routes.ts, src/features/employees/employee-form.test.tsx, src/features/employees/employee-form.tsx, src/features/employees/employee-list.tsx, src/pages/employee-new-page.tsx, src/pages/employees-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + drizzle/0002_add_manager_id.sql, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ shared/employees.ts

**F07-employee-manager-chat · ft4b-v2 · rep 1** — failed: typecheck, 15.3 min
- shape: bash(read) → read → bash×2 → read×4 → read! → read×6 → bash(read) → read → bash(read) → bash → bash(read) → read → edit → read → edit×2 → edit! → read! → read → edit → bash → bash(read) → read → edit → edit!×2 → read → write → edit! → read → edit! → write! → write → read → write → edit → write → edit! → write → bash(verify) → read×3 → bash(read) → bash(verify) → read → bash(read)×2 → bash → bash(read)! → bash(read)×3 → bash! → bash(read)×4 → bash(verify) → bash(read)!×2 → bash → bash(verify) → bash(read) → bash(read)!×5 → bash!×2 → bash(read) → write → bash(verify) → bash(read)×2 → write → bash(verify) → bash(read)×2 → edit×2 → edit! → read → write → bash(verify) → read → write → read → edit → edit! → read → edit → bash(verify) → write → bash(read) → write → bash(verify) → read → write → bash(verify) → write → bash(verify) → read → edit! → write
- Timed out after 15 min without finishing.
- 10 failed edit/write calls (wrong path or oldText not found).
- Wrote or read /tmp files 2 times instead of working in the project.
- Repeated identical bash commands 5 times.
- Ran verification 11 times.
- 105 turns for a difficulty 3 task.
- 1.07M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: drizzle/0002_modern_union_jack.sql, drizzle/meta/0002_snapshot.json, src/features/employees/employee-form.test.tsx, src/features/employees/employee-list.tsx, src/pages/employee-new-page.tsx, src/pages/employees-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: - drizzle/0000_init.sql, - drizzle/0001_add_employees.sql, - drizzle/meta/0000_snapshot.json, - drizzle/meta/0001_snapshot.json, - drizzle/meta/_journal.json, ~ server/db/schema.ts, ~ server/db/seed.ts, ~ server/features/employees/routes.test.ts, ~ server/features/employees/routes.ts, ~ server/test-db.ts, ~ shared/employees.ts, ~ src/features/employees/employee-form.tsx


written to /work/llm/bench/results/report-kpi-ft4b-v2.md
