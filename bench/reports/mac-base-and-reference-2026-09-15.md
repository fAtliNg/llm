### Solved by layer

| config | component | config | cross | form | mock | query | routing | test | all |
|---|---|---|---|---|---|---|---|---|---|
| base-bare | 0% (0/3) | - | 0% (0/1) | 0% (0/2) | - | 0% (0/3) | 0% (0/1) | 0% (0/1) | 0% (0/11) |
| base-harness | 18% (2/11) | - | 0% (0/1) | 0% (0/4) | 0% (0/1) | 13% (1/8) | 0% (0/2) | 0% (0/2) | 10% (3/29) |
| base-harness-thinking | 0% (0/3) | - | 0% (0/1) | 0% (0/2) | - | 0% (0/3) | 0% (0/1) | 0% (0/1) | 0% (0/11) |
| reference-deepseek | 100% (12/12) | 100% (4/4) | 100% (4/4) | 83% (5/6) | 100% (2/2) | 100% (11/11) | 100% (5/5) | 75% (3/4) | 96% (46/48) |

### Solved by difficulty

| config | 1 | 2 | 3 | all |
|---|---|---|---|---|
| base-bare | 0% (0/2) | 0% (0/8) | 0% (0/1) | 0% (0/11) |
| base-harness | 18% (2/11) | 6% (1/17) | 0% (0/1) | 10% (3/29) |
| base-harness-thinking | 0% (0/2) | 0% (0/8) | 0% (0/1) | 0% (0/11) |
| reference-deepseek | 94% (17/18) | 96% (25/26) | 100% (4/4) | 96% (46/48) |

### Solved by formulation

| config | spec | product | all |
|---|---|---|---|
| base-bare | 0% (0/5) | 0% (0/6) | 0% (0/11) |
| base-harness | 13% (2/15) | 7% (1/14) | 10% (3/29) |
| base-harness-thinking | 0% (0/5) | 0% (0/6) | 0% (0/11) |
| reference-deepseek | 93% (26/28) | 100% (20/20) | 96% (46/48) |

### Solved by prompt language

| config | en | ru | all |
|---|---|---|---|
| base-bare | 0% (0/11) | - | 0% (0/11) |
| base-harness | 5% (1/21) | 25% (2/8) | 10% (3/29) |
| base-harness-thinking | 0% (0/11) | - | 0% (0/11) |
| reference-deepseek | 95% (36/38) | 100% (10/10) | 96% (46/48) |

### Failure reasons

| config | reason | count |
|---|---|---|
| base-bare | typecheck | 7 |
| base-bare | wrong-behavior | 2 |
| base-bare | structure | 1 |
| base-bare | timeout | 1 |
| base-harness | typecheck | 14 |
| base-harness | wrong-behavior | 7 |
| base-harness | timeout | 3 |
| base-harness | structure | 1 |
| base-harness | format | 1 |
| base-harness-thinking | typecheck | 7 |
| base-harness-thinking | timeout | 3 |
| base-harness-thinking | wrong-behavior | 1 |
| reference-deepseek | format | 2 |

### Agent behaviour

| config | runs | ran verify | tool errors/run | turns/run | minutes/run |
|---|---|---|---|---|---|
| base-bare | 11 | 0% (0/11) | 12.2 | 33.5 | 6.9 |
| base-harness | 29 | 24% (7/29) | 6.0 | 26.6 | 6.3 |
| base-harness-thinking | 11 | 36% (4/11) | 12.1 | 42.5 | 20.7 |
| reference-deepseek | 48 | 94% (45/48) | 0.9 | 10.2 | 0.9 |

### Trajectory shape

| config | runs | calls before first edit | calls after last green verify | ends on green verify | saw red verify | repaired after red | never edited |
|---|---|---|---|---|---|---|---|
| base-bare | 11 | 12.3 | - | 0% (0/11) | 0% (0/11) | 0% (0/1) | 27% (3/11) |
| base-harness | 29 | 7.6 | 10.7 | 3% (1/29) | 0% (0/29) | 0% (0/1) | 14% (4/29) |
| base-harness-thinking | 11 | 7.0 | 5.0 | 0% (0/11) | 27% (3/11) | 100% (3/3) | 9% (1/11) |
| reference-deepseek | 48 | 7.0 | 0.1 | 79% (38/48) | 29% (14/48) | 100% (14/14) | 0% (0/48) |

### Time per config

| config | runs | median min | mean min | max min | total hours |
|---|---|---|---|---|---|
| base-bare | 11 | 3.6 | 6.9 | 30.0 | 1.3 |
| base-harness | 29 | 2.7 | 6.3 | 30.0 | 3.0 |
| base-harness-thinking | 11 | 10.2 | 20.7 | 45.0 | 3.8 |
| reference-deepseek | 48 | 0.6 | 0.9 | 5.1 | 0.7 |

### Per task

| task | config | rep | result | min | turns | tools | errors | verify runs | first edit (min) |
|---|---|---|---|---|---|---|---|---|---|
| T00-rename-button | base-bare | 1 | wrong-behavior | 0.1 | 1 |  | 0 | 0 | - |
| T00-rename-button | base-harness | 1 | wrong-behavior | 0.6 | 4 | bash 1, read 2 | 0 | 0 | - |
| T00-rename-button | base-harness-thinking | 1 | wrong-behavior | 1.6 | 8 | bash 4, read 3 | 2 | 0 | - |
| T00-rename-button | reference-deepseek | 1 | solved | 0.1 | 4 | bash 1, read 1, edit 1 | 0 | 0 | 0.1 |
| T00-rename-button-ru | base-harness | 1 | solved | 0.6 | 6 | bash 3, read 1, edit 1 | 1 | 0 | 0.5 |
| T00-rename-button-ru | reference-deepseek | 1 | solved | 0.1 | 4 | bash 1, read 1, edit 1 | 0 | 0 | 0.1 |
| T01-due-date | base-bare | 1 | typecheck | 3.6 | 22 | bash 3, read 11, edit 7 | 4 | 0 | 1.1 |
| T01-due-date | base-harness | 1 | wrong-behavior | 3.7 | 33 | bash 15, read 9, edit 13 | 14 | 0 | 1.0 |
| T01-due-date | base-harness-thinking | 1 | typecheck | 32.1 | 44 | bash 16, read 11, edit 12, write 3 | 17 | 0 | 1.7 |
| T01-due-date | reference-deepseek | 1 | solved | 1.6 | 19 | bash 9, read 13, edit 5 | 0 | 7 | 0.3 |
| T02-status-filter | base-bare | 1 | wrong-behavior | 0.8 | 9 | bash 4, read 4 | 0 | 0 | - |
| T02-status-filter | base-harness | 1 | timeout | 30.0 | 87 | bash 48, read 17, edit 5, write 15 | 28 | 1 | 1.1 |
| T02-status-filter | base-harness-thinking | 1 | typecheck | 2.1 | 11 | bash 2, read 6, edit 4 | 3 | 0 | 1.1 |
| T02-status-filter | reference-deepseek | 1 | solved | 1.0 | 13 | bash 7, read 8, edit 3 | 0 | 3 | 0.3 |
| T02-status-filter-ru | base-harness | 1 | typecheck | 4.5 | 34 | bash 16, read 9, edit 6, write 3 | 8 | 1 | 1.3 |
| T02-status-filter-ru | reference-deepseek | 1 | solved | 0.9 | 15 | bash 7, read 11, edit 3 | 2 | 3 | 0.3 |
| T03-delete-not-refreshing | base-bare | 1 | typecheck | 1.9 | 16 | bash 11, read 3, edit 1 | 2 | 0 | 1.4 |
| T03-delete-not-refreshing | base-harness | 1 | typecheck | 1.6 | 13 | bash 7, read 4, edit 1 | 3 | 2 | 1.0 |
| T03-delete-not-refreshing | base-harness-thinking | 1 | typecheck | 6.7 | 23 | bash 11, read 4, edit 8 | 6 | 4 | 1.2 |
| T03-delete-not-refreshing | reference-deepseek | 1 | solved | 0.3 | 4 | bash 3, edit 1 | 0 | 1 | 0.1 |
| T03-delete-not-refreshing-ru | base-harness | 1 | solved | 1.0 | 8 | read 3, bash 2, edit 3 | 3 | 0 | 0.7 |
| T03-delete-not-refreshing-ru | reference-deepseek | 1 | solved | 0.4 | 6 | bash 3, read 3, edit 1 | 0 | 1 | 0.1 |
| T04-empty-state | base-bare | 1 | typecheck | 10.1 | 109 | read 15, bash 65, write 12, edit 11 | 73 | 0 | 0.8 |
| T04-empty-state | base-harness | 1 | wrong-behavior | 0.4 | 4 | read 2, bash 3 | 1 | 0 | - |
| T04-empty-state | base-harness-thinking | 1 | timeout | 45.0 | 61 | write 6, bash 37, read 7, edit 9 | 15 | 0 | 0.4 |
| T04-empty-state | reference-deepseek | 1 | solved | 0.4 | 6 | read 4, bash 3, write 1, edit 1 | 1 | 1 | 0.2 |
| T05-badge-tests | base-bare | 1 | structure | 1.0 | 7 | bash 1, read 5 | 1 | 0 | - |
| T05-badge-tests | base-harness | 1 | structure | 2.2 | 16 | read 7, bash 6, write 2 | 2 | 1 | 1.3 |
| T05-badge-tests | base-harness-thinking | 1 | typecheck | 10.2 | 63 | read 6, bash 50, write 5, edit 1 | 22 | 18 | 1.0 |
| T05-badge-tests | reference-deepseek | 1 | solved | 0.6 | 9 | bash 5, read 4, write 1 | 1 | 3 | 0.1 |
| T06-task-details | base-bare | 1 | timeout | 30.0 | 89 | bash 51, read 15, write 8, edit 13 | 33 | 0 | 1.4 |
| T06-task-details | base-harness | 1 | typecheck | 2.8 | 17 | bash 4, read 11, write 2 | 2 | 0 | 1.4 |
| T06-task-details | base-harness-thinking | 1 | timeout | 45.0 | 79 | bash 54, read 15, write 5, edit 1 | 23 | 1 | 2.0 |
| T06-task-details | reference-deepseek | 1 | solved | 0.7 | 8 | bash 2, read 16, write 2, edit 2 | 0 | 1 | 0.4 |
| T06-task-details-ru | base-harness | 1 | wrong-behavior | 1.6 | 18 | read 11, bash 5, write 1 | 4 | 0 | 1.1 |
| T06-task-details-ru | reference-deepseek | 1 | solved | 0.7 | 11 | bash 3, read 15, edit 2, write 2 | 1 | 2 | 0.2 |
| T07-contacts-feature | base-bare | 1 | typecheck | 9.1 | 37 | bash 21, read 13, write 3 | 8 | 0 | 3.6 |
| T07-contacts-feature | base-harness | 1 | typecheck | 3.0 | 24 | bash 8, read 9, write 6 | 0 | 0 | 1.1 |
| T07-contacts-feature | base-harness-thinking | 1 | typecheck | 31.4 | 66 | read 20, bash 39, write 10, edit 4 | 20 | 0 | 1.1 |
| T07-contacts-feature | reference-deepseek | 1 | solved | 1.9 | 21 | bash 6, read 21, write 10, edit 6 | 3 | 5 | 0.3 |
| T08-task-stats | base-bare | 1 | typecheck | 5.4 | 33 | bash 16, read 6, edit 5, write 5 | 6 | 0 | 0.4 |
| T08-task-stats | base-harness | 1 | typecheck | 2.7 | 21 | read 9, bash 9, edit 2 | 1 | 0 | 0.8 |
| T08-task-stats | base-harness-thinking | 1 | typecheck | 7.4 | 30 | bash 4, read 13, edit 7, write 6 | 3 | 0 | 1.0 |
| T08-task-stats | reference-deepseek | 1 | solved | 0.8 | 11 | bash 3, read 8, edit 6 | 0 | 2 | 0.1 |
| T08-task-stats-ru | base-harness | 1 | typecheck | 4.0 | 31 | read 14, bash 10, edit 8, write 2 | 6 | 0 | 0.7 |
| T08-task-stats-ru | reference-deepseek | 1 | solved | 0.8 | 9 | bash 3, read 8, edit 7 | 0 | 2 | 0.2 |
| T09-select-field-refactor | base-bare | 1 | typecheck | 11.1 | 29 | read 8, bash 17, edit 1, write 1 | 5 | 0 | 6.1 |
| T09-select-field-refactor | base-harness | 1 | typecheck | 5.2 | 27 | bash 13, read 3, write 9 | 0 | 0 | 0.8 |
| T09-select-field-refactor | base-harness-thinking | 1 | typecheck | 1.7 | 8 | bash 2, read 3, write 1 | 0 | 0 | 1.3 |
| T09-select-field-refactor | reference-deepseek | 1 | solved | 0.7 | 9 | bash 2, read 6, write 1, edit 2 | 0 | 1 | 0.2 |
| T10-create-error | base-bare | 1 | typecheck | 3.0 | 16 | bash 3, read 7, edit 2, write 3 | 2 | 0 | 1.2 |
| T10-create-error | base-harness | 1 | typecheck | 4.9 | 23 | bash 14, read 5, edit 2, write 2 | 2 | 1 | 1.2 |
| T10-create-error | base-harness-thinking | 1 | timeout | 45.0 | 75 | bash 60, read 8, edit 5, write 1 | 22 | 13 | 1.0 |
| T10-create-error | reference-deepseek | 1 | solved | 0.8 | 11 | bash 5, read 13, edit 2 | 1 | 2 | 0.3 |
| T10-create-error-ru | base-harness | 1 | timeout | 30.0 | 59 | read 13, bash 31, edit 12, write 3 | 16 | 0 | 1.0 |
| T10-create-error-ru | reference-deepseek | 1 | solved | 1.0 | 17 | bash 7, read 11, edit 3 | 0 | 3 | 0.2 |
| T11-page-heading | base-harness | 1 | wrong-behavior | 5.9 | 52 | bash 40, read 8, edit 1 | 23 | 0 | 1.0 |
| T11-page-heading | reference-deepseek | 1 | solved | 0.6 | 8 | bash 5, read 3, edit 2 | 1 | 1 | 0.2 |
| T12-priority-sort | base-harness | 1 | typecheck | 1.8 | 13 | bash 2, read 5, edit 2, write 2 | 1 | 0 | 0.6 |
| T12-priority-sort | reference-deepseek | 1 | solved | 0.5 | 7 | bash 4, read 3, edit 1 | 1 | 2 | 0.1 |
| T13-task-count | base-harness | 1 | typecheck | 4.5 | 31 | bash 10, read 7, edit 7, write 5 | 5 | 0 | 1.0 |
| T13-task-count | reference-deepseek | 1 | solved | 0.9 | 11 | bash 6, read 2, edit 3 | 2 | 3 | 0.2 |
| T14-cancel-link | base-harness | 1 | typecheck | 23.9 | 69 | read 6, bash 55, edit 4, write 2 | 18 | 0 | 0.6 |
| T14-cancel-link | reference-deepseek | 1 | solved | 0.4 | 6 | bash 2, read 2, edit 1 | 0 | 1 | 0.1 |
| T15-badge-variants | base-harness | 1 | solved | 1.1 | 11 | read 4, bash 4, edit 2 | 2 | 1 | 0.5 |
| T15-badge-variants | reference-deepseek | 1 | solved | 0.4 | 5 | bash 2, read 1, edit 1 | 0 | 1 | 0.2 |
| T16-description-placeholder | base-harness | 1 | format | 0.8 | 9 | read 2, bash 5, edit 1 | 1 | 0 | 0.8 |
| T16-description-placeholder | reference-deepseek | 1 | format | 0.5 | 4 | bash 1, read 1, edit 1 | 0 | 0 | 0.4 |
| T17-mock-404-message | base-harness | 1 | wrong-behavior | 0.2 | 1 |  | 0 | 0 | - |
| T17-mock-404-message | reference-deepseek | 1 | solved | 0.8 | 7 | bash 3, read 2, edit 2 | 1 | 2 | 0.3 |
| T18-delete-api-test | base-harness | 1 | typecheck | 2.6 | 13 | read 4, edit 2, bash 3, write 3 | 1 | 0 | 0.4 |
| T18-delete-api-test | reference-deepseek | 1 | solved | 0.5 | 5 | read 2, edit 1, bash 1 | 0 | 1 | 0.3 |
| T19-title-search | base-harness | 1 | wrong-behavior | 0.6 | 5 | bash 2, read 2 | 0 | 0 | - |
| T19-title-search | reference-deepseek | 1 | solved | 2.0 | 17 | bash 5, read 6, edit 7 | 3 | 3 | 0.5 |
| T19-title-search-ru | base-harness | 1 | typecheck | 9.4 | 77 | bash 55, read 7, edit 2, write 7 | 30 | 0 | 1.0 |
| T19-title-search-ru | reference-deepseek | 1 | solved | 0.8 | 14 | bash 6, read 8, edit 4 | 0 | 2 | 0.2 |
| T20-mark-done | base-harness | 1 | typecheck | 2.5 | 15 | bash 2, read 5, edit 2, write 5 | 0 | 0 | 0.8 |
| T20-mark-done | reference-deepseek | 1 | solved | 1.0 | 8 | bash 3, read 6, write 1, edit 1 | 0 | 1 | 0.6 |
| T20-mark-done-ru | base-harness | 1 | timeout | 30.0 | 49 | bash 38, read 5, edit 3, write 4 | 2 | 6 | 1.0 |
| T20-mark-done-ru | reference-deepseek | 1 | solved | 0.4 | 6 | bash 2, read 5, write 1, edit 1 | 0 | 1 | 0.1 |
| T21-not-found-path | reference-deepseek | 1 | solved | 0.6 | 5 | bash 2, read 1, edit 1 | 0 | 1 | 0.3 |
| T22-edit-heading | reference-deepseek | 1 | solved | 0.6 | 7 | bash 4, read 1, edit 1 | 0 | 1 | 0.2 |
| T23-required-description | reference-deepseek | 1 | solved | 1.6 | 14 | bash 6, read 8, edit 4 | 0 | 2 | 0.4 |
| T24-task-labels | reference-deepseek | 1 | solved | 3.9 | 17 | bash 6, read 17, edit 7 | 2 | 3 | 2.8 |
| T24-task-labels-ru | reference-deepseek | 1 | solved | 5.1 | 48 | bash 18, read 21, edit 21 | 13 | 12 | 0.4 |
| T25-retry-test | reference-deepseek | 1 | format | 0.2 | 4 | read 1, edit 1, bash 1 | 0 | 1 | 0.1 |
| T26-mock-status-filter | reference-deepseek | 1 | solved | 0.3 | 6 | bash 2, read 3, edit 1 | 0 | 1 | 0.1 |
| T27-refresh-button | reference-deepseek | 1 | solved | 0.3 | 5 | bash 2, read 2, edit 1 | 0 | 1 | 0.1 |
| T28-default-priority | reference-deepseek | 1 | solved | 0.3 | 5 | bash 2, read 3, edit 2 | 0 | 1 | 0.1 |
| T29-tasks-redirect | reference-deepseek | 1 | solved | 0.5 | 8 | read 1, edit 2, bash 4 | 0 | 2 | 0.1 |
| T30-delete-error | reference-deepseek | 1 | solved | 0.6 | 12 | bash 5, read 6, edit 2 | 0 | 1 | 0.2 |
| T30-delete-error-ru | reference-deepseek | 1 | solved | 0.4 | 5 | bash 3, read 2, edit 1 | 1 | 1 | 0.1 |
| T31-empty-cta | reference-deepseek | 1 | solved | 0.3 | 5 | bash 2, read 1, edit 1 | 0 | 1 | 0.1 |
| T32-projects-feature | reference-deepseek | 1 | solved | 1.5 | 19 | bash 5, read 15, write 10, edit 7 | 2 | 3 | 0.2 |
| T33-form-edit-test | reference-deepseek | 1 | solved | 0.2 | 4 | read 2, edit 1, bash 1 | 0 | 1 | 0.1 |
| T34-env-app-name | reference-deepseek | 1 | solved | 0.4 | 5 | read 4, bash 2, edit 4 | 0 | 1 | 0.1 |
| T35-shadcn-tooltip | reference-deepseek | 1 | solved | 1.5 | 17 | bash 12, read 4, edit 4 | 3 | 5 | 0.3 |
| T36-eslint-curly | reference-deepseek | 1 | solved | 1.4 | 24 | bash 21, read 4, edit 4 | 3 | 17 | 0.3 |
| T37-split-handlers | reference-deepseek | 1 | solved | 0.3 | 5 | read 1, bash 3, write 2 | 0 | 1 | 0.1 |

### Observations per run

**T00-rename-button · base-bare · rep 1** — failed: wrong-behavior, 0.1 min
- No tool calls at all: the model answered in prose.
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T00-rename-button · base-harness · rep 1** — failed: wrong-behavior, 0.6 min
- shape: bash(read) → read×2
- Never edited or wrote a file.
- Used absolute paths in 3 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T00-rename-button · base-harness-thinking · rep 1** — failed: wrong-behavior, 1.6 min
- shape: bash(read) → read×2 → bash(read)! → bash(read) → read → bash(read)!
- Never edited or wrote a file.
- Read files through bash 4 times (cat/grep/sed) versus 3 read calls.
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T00-rename-button · reference-deepseek · rep 1** — solved, 0.1 min
- shape: bash(read) → read → edit
- Never ran the verification (npm run verify / tests).
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/tasks-page.tsx

**T00-rename-button-ru · base-harness · rep 1** — solved, 0.6 min
- shape: bash(read) → read → bash(read)! → bash(read) → edit
- Read files through bash 3 times (cat/grep/sed) versus 1 read calls.
- Never ran the verification (npm run verify / tests).
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/tasks-page.tsx

**T00-rename-button-ru · reference-deepseek · rep 1** — solved, 0.1 min
- shape: bash(read) → read → edit
- Never ran the verification (npm run verify / tests).
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/tasks-page.tsx

**T01-due-date · base-bare · rep 1** — failed: typecheck, 3.6 min
- shape: bash(read) → read×9 → edit×3 → edit! → read → bash(read) → edit!×2 → read → edit! → bash(read)
- 4 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 21 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Did not touch files the reference solution changes: src/features/tasks/task-form.test.tsx, src/features/tasks/task-list.tsx, src/mocks/db.ts.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/model.ts, ~ src/features/tasks/task-form.tsx

**T01-due-date · base-harness · rep 1** — failed: wrong-behavior, 3.7 min
- shape: bash(read) → read×4 → bash → bash(read) → read×3 → bash(read) → edit! → edit → read → edit! → read → edit!×4 → bash(read) → edit! → bash(read)×2 → edit!×3 → bash(read) → bash(read)! → bash(read) → bash(read)! → bash → edit → edit! → bash → bash! → bash(read)
- Read files through bash 11 times (cat/grep/sed) versus 9 read calls.
- 11 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 3 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- 33 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/features/tasks/task-form.test.tsx, src/features/tasks/task-list.tsx, src/mocks/db.ts.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.
- changed: ~ src/features/tasks/model.ts, ~ src/features/tasks/task-form.tsx

**T01-due-date · base-harness-thinking · rep 1** — failed: typecheck, 32.1 min
- shape: bash(read) → read×6 → edit! → edit → edit!×2 → bash(read) → edit!×2 → edit → bash! → bash(read) → bash! → edit! → bash(read)! → bash! → read → bash(read) → read → edit!×4 → bash(read) → bash! → read → read! → write → bash → write → read → write → bash → bash(read) → bash×2 → bash!
- 10 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 38 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Repeated identical bash commands 3 times.
- Never ran the verification (npm run verify / tests).
- Kept working 16.1 min after the last edit.
- 44 turns for a difficulty 2 task.
- 0.62M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: src/features/tasks/task-form.test.tsx, src/features/tasks/task-list.tsx, src/mocks/db.ts.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/tasks/task-form.tsx.new, ~ src/features/tasks/model.ts, ~ src/features/tasks/task-form.tsx

**T01-due-date · reference-deepseek · rep 1** — solved, 1.6 min
- shape: bash(read) → read×7 → bash(read) → read×6 → edit×4 → bash(verify)×6 → edit → bash(verify)
- Ran verification 7 times.
- changed: ~ src/features/tasks/model.ts, ~ src/features/tasks/task-form.test.tsx, ~ src/features/tasks/task-form.tsx, ~ src/features/tasks/task-list.tsx

**T02-status-filter · base-bare · rep 1** — failed: wrong-behavior, 0.8 min
- shape: bash(read)×3 → read×4 → bash(read)
- Never edited or wrote a file.
- Used absolute paths in 8 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T02-status-filter · base-harness · rep 1** — failed: typecheck, 30.0 min
- shape: bash(read)×3 → read×3 → bash(read) → read → bash(read) → read → edit → edit! → read → write → bash(read) → write → bash(read) → read → bash(read) → read → edit! → write → bash(read) → bash(verify) → read → write → bash(read) → read → bash(read)×2 → bash×3 → bash! → bash×2 → bash(read) → bash → bash(read)×2 → bash! → bash → write → edit! → write → bash(read) → read×2 → bash(read) → bash!×3 → write → write! → bash! → read → bash! → edit! → bash! → read → write×2 → read → write → bash!×7 → write → bash!×3 → write → bash! → write → bash! → read×2 → write → bash!×3
- Timed out after 30 min without finishing.
- 5 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 55 calls; the tools take paths relative to the project.
- Repeated identical bash commands 21 times.
- Changed directory 8 times; the cwd is already the project.
- Kept working 10.9 min after the last edit.
- 87 turns for a difficulty 2 task.
- 1.43M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/api.ts, ~ src/pages/tasks-page.tsx

**T02-status-filter · base-harness-thinking · rep 1** — failed: typecheck, 2.1 min
- shape: bash(read) → read×3 → bash(read) → read×2 → edit → edit!×2 → read → edit!
- 3 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 12 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/task-list.tsx

**T02-status-filter · reference-deepseek · rep 1** — solved, 1.0 min
- shape: bash(read) → read×3 → bash(read) → read×2 → bash(read) → read → bash(read) → read×2 → edit×2 → bash(verify) → edit → bash(verify)×2
- changed: ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T02-status-filter-ru · base-harness · rep 1** — failed: typecheck, 4.5 min
- shape: bash(read)×3 → read×4 → bash(read) → read → bash(read) → read → edit!×2 → bash(read) → edit! → read → edit! → bash(read) → edit! → write → bash(read) → bash → bash! → write → bash(verify) → bash → bash(read) → write → bash → read → bash(read) → bash! → read → edit!
- Read files through bash 11 times (cat/grep/sed) versus 9 read calls.
- 6 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 15 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- 34 turns for a difficulty 2 task.
- Result does not typecheck: see typecheck.log.
- changed: + temp-edit.sh, ~ src/pages/tasks-page.tsx

**T02-status-filter-ru · reference-deepseek · rep 1** — solved, 0.9 min
- shape: bash(read) → read×4 → bash(read) → read×4 → bash(read) → read×2 → edit → read → edit → bash(verify)! → edit → bash(verify)! → bash → bash(verify)
- changed: ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T03-delete-not-refreshing · base-bare · rep 1** — failed: typecheck, 1.9 min
- shape: bash(read)×4 → read → bash(read)×2 → bash → bash(read)! → bash(read)×2 → bash(read)! → read → edit → read
- Read files through bash 10 times (cat/grep/sed) versus 3 read calls.
- Used absolute paths in 15 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Result does not typecheck: see typecheck.log.

**T03-delete-not-refreshing · base-harness · rep 1** — failed: typecheck, 1.6 min
- shape: bash(read) → read! → bash(read) → read → bash(read)! → bash(read) → read → edit → bash(verify)×2 → bash(read)! → read
- Read files through bash 5 times (cat/grep/sed) versus 4 read calls.
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Changed directory 2 times; the cwd is already the project.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/api.ts

**T03-delete-not-refreshing · base-harness-thinking · rep 1** — failed: typecheck, 6.7 min
- shape: bash(read) → read → bash(read) → read×2 → edit → bash(verify)! → edit! → bash(read)×2 → edit! → read → edit → bash(verify) → bash → edit → bash(verify)! → edit → bash(verify)! → bash(read) → edit → edit! → bash
- Read files through bash 5 times (cat/grep/sed) versus 4 read calls.
- 3 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 23 calls; the tools take paths relative to the project.
- Changed directory 6 times; the cwd is already the project.
- Ran verification 4 times.
- Workspace unchanged: nothing was delivered.
- Result does not typecheck: see typecheck.log.

**T03-delete-not-refreshing · reference-deepseek · rep 1** — solved, 0.3 min
- shape: bash(read)×2 → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/api.ts

**T03-delete-not-refreshing-ru · base-harness · rep 1** — solved, 1.0 min
- shape: read! → bash(read) → read → bash(read) → read → edit!×2 → edit
- 2 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/api.ts

**T03-delete-not-refreshing-ru · reference-deepseek · rep 1** — solved, 0.4 min
- shape: bash → read → bash → read×2 → edit → bash(verify)
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Changed directory 3 times; the cwd is already the project.
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/api.ts

**T04-empty-state · base-bare · rep 1** — failed: typecheck, 10.1 min
- shape: read! → bash(read)×6 → read → bash(read) → read → write → edit!×2 → read → edit! → bash(read)! → bash(read) → bash → bash(read) → edit! → edit → read → edit! → bash(read)×3 → bash → edit! → bash(read) → bash! → edit! → bash(read) → bash!×2 → bash×4 → bash(read)! → bash×2 → bash(read) → bash(read)! → bash!×3 → read! → bash → bash!×2 → edit! → read! → bash!×2 → read! → bash!×12 → edit! → write!×5 → bash!×3 → read!×4 → edit! → read!×2 → bash! → read! → write! → bash!×3 → write! → bash! → write! → bash!×6 → write! → bash!×2 → write!×2
- Read files through bash 18 times (cat/grep/sed) versus 15 read calls.
- 21 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 45 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Repeated identical bash commands 31 times.
- Changed directory 3 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- 109 turns for a difficulty 1 task.
- 1.57M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + src/components/empty-state.tsx, ~ src/features/tasks/task-list.tsx

**T04-empty-state · base-harness · rep 1** — failed: wrong-behavior, 0.4 min
- shape: read! → bash(read)×2 → read → bash(read)
- Never edited or wrote a file.
- Read files through bash 3 times (cat/grep/sed) versus 2 read calls.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T04-empty-state · base-harness-thinking · rep 1** — failed: typecheck, 45.0 min
- shape: write → bash(read)×2 → read → edit → read → edit! → bash(read) → edit! → read → edit → edit! → bash(read) → bash(read)! → bash(read) → read → edit → read → edit! → bash(read)×5 → edit! → bash(read)×3 → bash → bash(read)×2 → edit! → write → bash(read)! → write → read → write → bash(read)×2 → bash → bash(read)×5 → write → bash(read)! → read → write → bash → bash(read)! → bash! → bash(read)!×2 → bash(read)×2 → bash → bash!×2
- Timed out after 45 min without finishing.
- Read files through bash 30 times (cat/grep/sed) versus 7 read calls.
- 6 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 3 times instead of working in the project.
- Never ran the verification (npm run verify / tests).
- Kept working 26.1 min after the last edit.
- 61 turns for a difficulty 1 task.
- 0.86M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + src/components/empty-state.tsx, ~ src/features/tasks/task-list.tsx

**T04-empty-state · reference-deepseek · rep 1** — solved, 0.4 min
- shape: read! → bash(read)×2 → read×3 → write → edit → bash(verify)
- Used absolute paths in 9 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: + src/components/empty-state.tsx, ~ src/features/tasks/task-list.tsx

**T05-badge-tests · base-bare · rep 1** — failed: structure, 1.0 min
- shape: bash(read) → read! → read×4
- Never edited or wrote a file.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Structural checks failed: missing file: src/features/tasks/task-badges.test.tsx.

**T05-badge-tests · base-harness · rep 1** — failed: structure, 2.2 min
- shape: read! → bash(read) → read → read! → bash(read) → read×4 → write → bash → write → bash×2 → bash(verify)
- Used absolute paths in 3 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 1 times instead of working in the project.
- Workspace unchanged: nothing was delivered.
- Structural checks failed: missing file: src/features/tasks/task-badges.test.tsx.

**T05-badge-tests · base-harness-thinking · rep 1** — failed: typecheck, 10.2 min
- shape: read! → bash(read) → read → bash(read) → read×2 → write → bash(read) → write → read → write → bash(verify)×2 → bash(read) → bash(verify)×2 → bash×2 → bash(verify) → bash(read) → read → bash! → bash(verify)!×2 → bash → bash(read) → bash(verify) → bash(read) → bash(verify) → bash(read) → edit! → bash(verify)!×2 → bash! → bash → bash(verify)! → bash(verify) → bash! → bash → bash(verify) → bash → bash(verify) → bash(read) → bash(verify) → bash!×3 → bash → bash(verify) → bash(read)! → bash → write → bash(read)! → bash! → bash(read) → bash(read)!×2 → write → bash(read)!×2 → bash!×2
- Read files through bash 24 times (cat/grep/sed) versus 6 read calls.
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 53 calls; the tools take paths relative to the project.
- Ran verification 18 times.
- 63 turns for a difficulty 2 task.
- 0.87M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + _USERFILE_, + src/features/tasks/task-badges.test.tsx

**T05-badge-tests · reference-deepseek · rep 1** — solved, 0.6 min
- shape: bash(read) → read×4 → write → bash(verify) → bash(verify)! → bash → bash(verify)
- changed: + src/features/tasks/task-badges.test.tsx

**T06-task-details · base-bare · rep 1** — failed: typecheck, 30.0 min
- shape: bash(read)×2 → read×6 → bash(read) → read×4 → write → bash → write → bash(read)×2 → bash×3 → bash(read)!×2 → bash! → write → bash!×2 → bash → bash! → bash → edit → bash! → bash×2 → bash!×2 → bash → bash!×2 → read → bash → read → bash → edit!×3 → bash! → edit! → bash(read)! → read → edit!×3 → edit → edit! → bash! → edit! → read → bash! → bash(read)! → write → bash×2 → edit! → write → bash(read)! → write → bash(read) → write! → bash(read) → bash → write! → bash(read) → bash → read! → bash(read)! → bash×4 → bash(read) → bash → bash(read)! → bash(read)×2 → edit! → bash
- Timed out after 30 min without finishing.
- Read files through bash 18 times (cat/grep/sed) versus 15 read calls.
- 13 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 81 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 7 times instead of working in the project.
- Never ran the verification (npm run verify / tests).
- Kept working 4.6 min after the last edit.
- 89 turns for a difficulty 2 task.
- 1.32M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + file, + src/pages/task-detail-page.tsx, + src/pages/task-detail-page.tsx.tmp

**T06-task-details · base-harness · rep 1** — failed: typecheck, 2.8 min
- shape: bash(read) → read! → bash(read) → read×2 → bash(read)! → bash(read) → read×7 → write×2 → read
- Used absolute paths in 17 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: + src/pages/task-detail-page.tsx

**T06-task-details · base-harness-thinking · rep 1** — failed: typecheck, 45.0 min
- shape: bash(read) → read → read! → bash(read) → read×5 → bash(read) → read → bash(read) → write×2 → bash(read)×3 → bash(read)! → bash(read)×2 → bash! → bash(read)! → bash → bash(read)×2 → bash → bash!×2 → bash(read)! → bash(verify)! → bash(read) → bash → bash! → bash×5 → bash! → bash(read)! → bash×2 → bash(read)×2 → bash×2 → bash!×2 → bash → bash(read) → bash → bash(read)!×2 → bash → bash(read) → bash!×4 → edit → write → read×2 → write → read×5 → write → bash! → bash → bash!×2 → bash(read)!
- Timed out after 45 min without finishing.
- Read files through bash 24 times (cat/grep/sed) versus 15 read calls.
- Used absolute paths in 61 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Changed directory 3 times; the cwd is already the project.
- Kept working 14.2 min after the last edit.
- 79 turns for a difficulty 2 task.
- 1.10M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: src/features/tasks/task-list.tsx, src/pages/task-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/details-page.ts, + src/pages/task-details-page.tsx, ~ src/app/router.tsx

**T06-task-details · reference-deepseek · rep 1** — solved, 0.7 min
- shape: bash(read) → read×16 → write → edit×2 → write → bash(verify)
- Used absolute paths in 22 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: + src/pages/task-details-page.test.tsx, + src/pages/task-details-page.tsx, ~ src/app/router.tsx, ~ src/features/tasks/task-list.tsx

**T06-task-details-ru · base-harness · rep 1** — failed: wrong-behavior, 1.6 min
- shape: read! → bash(read) → read×2 → read! → bash(read) → read×3 → bash(read) → read×2 → write → read → bash! → bash(read) → read!
- Used absolute paths in 16 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T06-task-details-ru · reference-deepseek · rep 1** — solved, 0.7 min
- shape: bash(read) → read×15 → edit×2 → write×2 → bash(verify)! → bash(verify)
- changed: + src/pages/task-detail-page.test.tsx, + src/pages/task-detail-page.tsx, ~ src/app/router.tsx, ~ src/features/tasks/task-list.tsx

**T07-contacts-feature · base-bare · rep 1** — failed: typecheck, 9.1 min
- shape: bash(read)×3 → read×2 → bash(read) → read×4 → bash(read) → read → bash(read)! → bash(read)×2 → read → bash(read) → bash(read)! → bash(read) → read×3 → bash(read)×2 → read×2 → bash(read)! → bash(read) → bash → bash(read)!×2 → bash! → bash(read)! → write → bash → write → write!
- Read files through bash 18 times (cat/grep/sed) versus 13 read calls.
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 37 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- First edit only after 3.6 min of exploration.
- 37 turns for a difficulty 3 task.
- Did not touch files the reference solution changes: src/api/base-api.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/contacts/api.ts, src/features/contacts/contact-form.tsx, src/features/contacts/contact-list.tsx, src/mocks/db.ts, src/mocks/handlers.ts, src/pages/contact-new-page.tsx, src/pages/contacts-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/contacts/contact-form.test.tsx, + src/features/contacts/model.ts

**T07-contacts-feature · base-harness · rep 1** — failed: typecheck, 3.0 min
- shape: bash×2 → read×8 → write×5 → bash → write → bash → bash(read) → bash×2 → read → bash
- Used absolute paths in 22 calls; the tools take paths relative to the project.
- Changed directory 7 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- Did not touch files the reference solution changes: src/api/base-api.ts, src/app/root-layout.tsx, src/app/router.tsx, src/features/contacts/contact-form.tsx, src/features/contacts/contact-list.tsx, src/mocks/db.ts, src/mocks/handlers.ts, src/pages/contact-new-page.tsx, src/pages/contacts-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/contacts/api.ts, + src/features/contacts/model.ts, - src/features/tasks/api.test.ts

**T07-contacts-feature · base-harness-thinking · rep 1** — failed: typecheck, 31.4 min
- shape: read → bash(read) → read×2 → bash(read)×2 → read×7 → bash(read) → write×2 → read → edit×2 → bash(read) → read → edit! → write → read → edit → bash(read) → write×2 → bash → write → bash(read) → bash → bash(read) → bash → bash(read) → bash×2 → bash(read)! → bash(read) → bash → bash(read) → bash → bash(read) → bash! → bash×2 → read → bash(read)! → bash! → bash → bash! → read! → bash!×3 → write → read → write → bash!×3 → read → write → bash! → read → bash! → read → write → bash!×3 → read! → bash!
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 20 calls; the tools take paths relative to the project.
- Repeated identical bash commands 12 times.
- Changed directory 2 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- Kept working 16.8 min after the last edit.
- 66 turns for a difficulty 3 task.
- 1.10M input tokens processed: the context grew large and was re-sent every turn.
- Did not touch files the reference solution changes: src/app/root-layout.tsx, src/app/router.tsx, src/features/contacts/contact-form.tsx, src/features/contacts/contact-list.tsx, src/pages/contact-new-page.tsx, src/pages/contacts-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + db.ts, + src/features/contacts/api.ts, + src/features/contacts/model.ts, + src/mocks/db.txt, + test_line_check.db, ~ src/api/base-api.ts, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts

**T07-contacts-feature · reference-deepseek · rep 1** — solved, 1.9 min
- shape: bash(read) → read×21 → write×2 → edit → write → edit → write×4 → edit×2 → bash(verify)! → edit → bash(verify)! → edit → bash(verify) → write×3 → bash(verify)! → bash(verify)
- Repeated identical bash commands 3 times.
- Ran verification 5 times.
- Changed 14 files, the reference solution changes 11.
- changed: + src/features/contacts/api.test.ts, + src/features/contacts/api.ts, + src/features/contacts/contact-form.test.tsx, + src/features/contacts/contact-form.tsx, + src/features/contacts/contact-list.tsx, + src/features/contacts/model.ts, + src/pages/contact-new-page.tsx, + src/pages/contacts-page.test.tsx, + src/pages/contacts-page.tsx, ~ src/api/base-api.ts, ~ src/app/root-layout.tsx, ~ src/app/router.tsx, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts

**T08-task-stats · base-bare · rep 1** — failed: typecheck, 5.4 min
- shape: bash(read) → read! → read×2 → edit! → bash(read) → edit! → bash → bash(read) → bash → edit! → bash → edit! → bash → write → bash(read)×2 → read → edit! → bash → write → bash → bash(read) → write → read → write → bash(read) → bash → write → bash(read)×2 → read
- Read files through bash 9 times (cat/grep/sed) versus 6 read calls.
- 5 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 15 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- 33 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/features/tasks/api.ts, src/features/tasks/model.ts, src/mocks/db.ts.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/task-list.tsx, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.tsx

**T08-task-stats · base-harness · rep 1** — failed: typecheck, 2.7 min
- shape: read → bash(read)! → bash(read) → read×2 → bash(read) → read×2 → bash(read) → read → edit → read → bash → bash(read) → read×2 → edit → bash(read)×3
- Wrote or read /tmp files 1 times instead of working in the project.
- Never ran the verification (npm run verify / tests).
- Did not touch files the reference solution changes: src/features/tasks/api.ts, src/features/tasks/model.ts, src/pages/tasks-page.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/mocks/db_new.ts, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts

**T08-task-stats · base-harness-thinking · rep 1** — failed: typecheck, 7.4 min
- shape: bash(read)×2 → read×7 → edit → read → write → edit → read → edit → edit! → read → write×2 → read → edit! → bash(read) → edit → read → edit! → write×2 → bash → read → write
- 3 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- Did not touch files the reference solution changes: src/features/tasks/model.ts.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/api.ts, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.tsx

**T08-task-stats · reference-deepseek · rep 1** — solved, 0.8 min
- shape: bash(read) → read×8 → edit×5 → bash(verify) → edit → bash(verify)
- changed: ~ src/features/tasks/api.ts, ~ src/features/tasks/model.ts, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T08-task-stats-ru · base-harness · rep 1** — failed: typecheck, 4.0 min
- shape: read×2 → read! → bash(read)×2 → read → bash(read) → bash(read)! → read×3 → edit! → edit → read → edit×2 → edit! → bash(read)! → bash(read) → read → edit → read → write → bash(read)×3 → read → edit → read → edit! → read → write → bash(read) → read
- 3 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 3 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- 31 turns for a difficulty 2 task.
- Did not touch files the reference solution changes: src/features/tasks/model.ts, src/mocks/db.ts.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/api.ts, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.tsx

**T08-task-stats-ru · reference-deepseek · rep 1** — solved, 0.8 min
- shape: bash(read) → read×8 → edit×6 → bash(verify) → edit → bash(verify)
- changed: ~ src/features/tasks/api.ts, ~ src/features/tasks/model.ts, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T09-select-field-refactor · base-bare · rep 1** — failed: typecheck, 11.1 min
- shape: read! → bash(read)×2 → read → read! → read → bash(read) → read → edit → read → bash → read → bash → bash(read) → bash → bash(read) → write → bash×3 → bash!×2 → bash(read) → read → bash → bash! → bash
- Used absolute paths in 15 calls; the tools take paths relative to the project.
- Changed directory 10 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- First edit only after 6.1 min of exploration.
- Result does not typecheck: see typecheck.log.
- changed: + temp_select.txt, ~ src/components/ui/select.tsx

**T09-select-field-refactor · base-harness · rep 1** — failed: typecheck, 5.2 min
- shape: bash(read)×2 → read×2 → bash(read)×2 → write×2 → bash(read) → bash → write → bash → write → bash → write → read → bash → write → bash → write → bash → bash(read) → write → bash → write
- Read files through bash 6 times (cat/grep/sed) versus 3 read calls.
- Used absolute paths in 21 calls; the tools take paths relative to the project.
- Repeated identical bash commands 6 times.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: + src/features/tasks/select-item-controller.tsx

**T09-select-field-refactor · base-harness-thinking · rep 1** — failed: typecheck, 1.7 min
- shape: bash(read) → read×2 → bash(read) → read → write
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: + src/features/tasks/model-select-fields.tsx

**T09-select-field-refactor · reference-deepseek · rep 1** — solved, 0.7 min
- shape: bash(read) → read×5 → write → edit → read → edit → bash(verify)
- changed: + src/features/tasks/select-field.tsx, ~ src/features/tasks/task-form.tsx

**T10-create-error · base-bare · rep 1** — failed: typecheck, 3.0 min
- shape: bash(read) → read×6 → edit! → bash(read) → edit! → read → write×2 → bash(read) → write
- 2 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 15 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: ~ src/pages/task-new-page.tsx

**T10-create-error · base-harness · rep 1** — failed: typecheck, 4.9 min
- shape: bash(read) → read → bash(read) → read×2 → bash(read)×2 → read×2 → bash(read) → edit! → bash(read) → edit! → write×2 → bash(read)×2 → bash×4 → bash(read) → bash
- Read files through bash 9 times (cat/grep/sed) versus 5 read calls.
- 2 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 6 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Changed directory 5 times; the cwd is already the project.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/pages/task-new-page.tsx

**T10-create-error · base-harness-thinking · rep 1** — failed: typecheck, 45.0 min
- shape: bash(read) → read×2 → bash(read)×2 → edit! → edit → read → bash(read)×2 → edit → read → edit → read → bash(verify) → bash(read)! → bash(read) → write → bash(verify) → bash(read)! → read → bash → bash!×2 → bash(read) → bash! → bash → bash(verify) → bash! → bash(read)! → bash → bash(read) → bash → bash(verify)×2 → bash! → bash(verify)! → bash → bash(verify) → bash! → bash → read → edit! → bash! → read → bash(verify)! → bash! → bash → bash(read)! → bash(read) → bash! → bash → bash(read) → bash(verify) → bash(verify)! → bash → bash! → bash → bash(read) → bash(verify)×2 → bash!×2 → bash → bash! → bash×7 → bash(verify) → bash
- Timed out after 45 min without finishing.
- Read files through bash 16 times (cat/grep/sed) versus 8 read calls.
- 2 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 12 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Changed directory 2 times; the cwd is already the project.
- Ran verification 13 times.
- Kept working 37.5 min after the last edit.
- 75 turns for a difficulty 2 task.
- 1.13M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + task-new-page.txt, ~ src/pages/task-new-page.tsx

**T10-create-error · reference-deepseek · rep 1** — solved, 0.8 min
- shape: bash×2 → read×9 → bash → read×2 → edit → read×2 → edit → bash(verify)! → bash(verify)
- Used absolute paths in 20 calls; the tools take paths relative to the project.
- Changed directory 5 times; the cwd is already the project.
- changed: ~ src/pages/task-new-page.test.tsx, ~ src/pages/task-new-page.tsx

**T10-create-error-ru · base-harness · rep 1** — failed: typecheck, 30.0 min
- shape: read! → bash(read) → read×2 → edit! → edit → read → bash! → bash×4 → write → bash×2 → read!×2 → bash(read) → bash → read → edit!×2 → write → bash → write → bash×2 → read → edit! → bash → read → edit! → bash(read) → bash×3 → bash(read) → bash×2 → read! → read → edit!×3 → bash×2 → read → edit!×2 → read! → bash → edit → bash×3 → bash(read)×2 → bash×2
- Timed out after 30 min without finishing.
- 10 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 29 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 10 times instead of working in the project.
- Changed directory 15 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- Kept working 14.9 min after the last edit.
- 59 turns for a difficulty 2 task.
- 0.93M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/task-form.tsx

**T10-create-error-ru · reference-deepseek · rep 1** — solved, 1.0 min
- shape: bash(read) → read×3 → bash(read) → read×4 → edit×2 → bash(verify) → read → bash(read) → read×2 → bash(read) → read → edit → bash(verify)×2
- changed: ~ src/features/tasks/task-form.tsx, ~ src/pages/task-new-page.test.tsx, ~ src/pages/task-new-page.tsx

**T11-page-heading · base-harness · rep 1** — failed: wrong-behavior, 5.9 min
- shape: bash(read) → read → read! → bash(read)×4 → read! → bash(read) → read → edit → bash(read) → bash(read)! → bash(read) → read×2 → bash(read) → read! → bash(read)×2 → bash(read)! → bash(read)×3 → bash(read)! → bash(read)×2 → bash(read)!×2 → read → bash(read)! → bash(read) → bash(read)! → bash(read) → bash(read)!×6 → bash(read) → bash(read)!×4 → bash → bash(read)!×3
- Read files through bash 39 times (cat/grep/sed) versus 8 read calls.
- Used absolute paths in 48 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 1 times instead of working in the project.
- Never ran the verification (npm run verify / tests).
- Kept working 4.9 min after the last edit.
- 52 turns for a difficulty 1 task.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.
- changed: ~ src/app/root-layout.tsx

**T11-page-heading · reference-deepseek · rep 1** — solved, 0.6 min
- shape: bash(read)×2 → read×2 → edit×2 → bash(read)! → bash(read) → read → bash(verify)
- Read files through bash 4 times (cat/grep/sed) versus 3 read calls.
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/task-new-page.test.tsx, ~ src/pages/tasks-page.tsx

**T12-priority-sort · base-harness · rep 1** — failed: typecheck, 1.8 min
- shape: bash(read) → read×2 → bash(read) → read → edit → read → edit! → write → read → write
- 1 failed edit/write calls (wrong path or oldText not found).
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/task-list.tsx

**T12-priority-sort · reference-deepseek · rep 1** — solved, 0.5 min
- shape: bash(read) → read×3 → edit → bash(verify)! → bash → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-list.tsx

**T13-task-count · base-harness · rep 1** — failed: typecheck, 4.5 min
- shape: bash(read)×2 → read×4 → edit → bash(read) → edit! → read → edit×2 → read → edit!×2 → read → write×5 → bash(read)×2 → bash×2 → edit! → bash(read) → bash → bash(read)!
- 4 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 29 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Never ran the verification (npm run verify / tests).
- 31 turns for a difficulty 1 task.
- Did not touch files the reference solution changes: src/pages/task-new-page.test.tsx.
- Result does not typecheck: see typecheck.log.
- changed: + src/pages/taskscage.tsx, ~ src/pages/tasks-page.tsx

**T13-task-count · reference-deepseek · rep 1** — solved, 0.9 min
- shape: bash×2 → read×2 → edit×2 → bash(verify)! → edit → bash(verify)! → bash → bash(verify)
- Used absolute paths in 11 calls; the tools take paths relative to the project.
- Changed directory 6 times; the cwd is already the project.
- changed: ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T14-cancel-link · base-harness · rep 1** — failed: typecheck, 23.9 min
- shape: read! → bash(read)×3 → read → bash(read) → edit → read → bash(read) → edit → read → edit → read → bash(read) → write → bash(read) → write → bash×2 → bash(read)×2 → edit → read → bash(read)×2 → bash×2 → bash(read) → bash! → bash(read) → bash×2 → bash(read) → bash → bash(read)×6 → bash! → bash(read) → bash(read)! → bash(read)×2 → bash(read)! → bash(read) → bash(read)! → bash(read) → bash! → bash(read)! → bash(read) → bash(read)! → bash(read) → bash! → bash(read) → bash(read)! → bash → bash(read) → bash(read)! → bash! → bash(read)! → bash → bash(read)! → bash! → bash(read)! → bash!
- Read files through bash 39 times (cat/grep/sed) versus 6 read calls.
- Used absolute paths in 51 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 5 times instead of working in the project.
- Changed directory 6 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- Kept working 19.1 min after the last edit.
- 69 turns for a difficulty 1 task.
- 0.96M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: - src/features/tasks/task-form.tsx

**T14-cancel-link · reference-deepseek · rep 1** — solved, 0.4 min
- shape: bash(read) → read×2 → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-form.tsx

**T15-badge-variants · base-harness · rep 1** — solved, 1.1 min
- shape: read! → bash(read)×3 → read → edit! → read → edit → read → bash(verify)
- 1 failed edit/write calls (wrong path or oldText not found).
- changed: ~ src/features/tasks/task-badges.tsx

**T15-badge-variants · reference-deepseek · rep 1** — solved, 0.4 min
- shape: bash(read) → read → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-badges.tsx

**T16-description-placeholder · base-harness · rep 1** — failed: format, 0.8 min
- shape: read! → bash(read)×5 → read → edit
- Read files through bash 5 times (cat/grep/sed) versus 2 read calls.
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Only format failed: the code works but ignores project conventions.
- changed: ~ src/features/tasks/task-form.tsx

**T16-description-placeholder · reference-deepseek · rep 1** — failed: format, 0.5 min
- shape: bash(read) → read → edit
- Never ran the verification (npm run verify / tests).
- Only format failed: the code works but ignores project conventions.
- changed: ~ src/features/tasks/task-form.tsx

**T17-mock-404-message · base-harness · rep 1** — failed: wrong-behavior, 0.2 min
- No tool calls at all: the model answered in prose.
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T17-mock-404-message · reference-deepseek · rep 1** — solved, 0.8 min
- shape: bash(read) → read×2 → edit → bash(verify)! → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/mocks/handlers.ts

**T18-delete-api-test · base-harness · rep 1** — failed: typecheck, 2.6 min
- shape: read → edit! → bash(read) → bash → edit → read → write → read → write → bash(read) → read → write
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 12 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: ~ src/features/tasks/api.test.ts

**T18-delete-api-test · reference-deepseek · rep 1** — solved, 0.5 min
- shape: read×2 → edit → bash(verify)
- Used absolute paths in 4 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/api.test.ts

**T19-title-search · base-harness · rep 1** — failed: wrong-behavior, 0.6 min
- shape: bash(read) → read×2 → bash(read)
- Never edited or wrote a file.
- Never ran the verification (npm run verify / tests).
- Workspace unchanged: nothing was delivered.
- Verify passes but hidden tests fail: the behaviour differs from the spec. See hidden.log.

**T19-title-search · reference-deepseek · rep 1** — solved, 2.0 min
- shape: bash → read×4 → edit×2 → read → edit×3 → bash(verify)! → edit! → read → edit → bash(verify)! → bash → bash(verify)
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 18 calls; the tools take paths relative to the project.
- Changed directory 5 times; the cwd is already the project.
- changed: ~ src/features/tasks/task-list.tsx, ~ src/pages/tasks-page.test.tsx, ~ src/pages/tasks-page.tsx

**T19-title-search-ru · base-harness · rep 1** — failed: typecheck, 9.4 min
- shape: bash(read) → read → read! → bash(read) → read → bash(read) → read → edit! → bash → read → write×4 → bash → write → bash! → bash → read → write×2 → bash → read → bash×3 → bash(read)×2 → bash!×2 → bash(read) → bash! → bash(read) → bash!×2 → bash → edit! → bash(read) → bash → bash! → bash → bash(read)×2 → bash → bash(read)!×2 → bash → bash(read)! → bash(read) → bash → bash(read)! → bash → bash(read)! → bash(read) → bash(read)!×3 → bash → bash(read) → bash(read)! → bash! → bash(read)! → bash!×9
- Read files through bash 23 times (cat/grep/sed) versus 7 read calls.
- 2 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 47 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 3 times instead of working in the project.
- Repeated identical bash commands 7 times.
- Changed directory 12 times; the cwd is already the project.
- Never ran the verification (npm run verify / tests).
- Kept working 4.4 min after the last edit.
- 77 turns for a difficulty 2 task.
- 0.90M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: - src/features/tasks/task-list.tsx

**T19-title-search-ru · reference-deepseek · rep 1** — solved, 0.8 min
- shape: bash(read)×2 → read×3 → bash(read) → read×3 → edit → read → edit → bash(read) → read → edit → bash(verify) → edit → bash(verify)
- changed: ~ src/features/tasks/task-list.tsx, ~ src/pages/tasks-page.test.tsx

**T20-mark-done · base-harness · rep 1** — failed: typecheck, 2.5 min
- shape: bash(read) → read×4 → edit → write×3 → edit → read → write×2 → bash
- Used absolute paths in 14 calls; the tools take paths relative to the project.
- Never ran the verification (npm run verify / tests).
- Result does not typecheck: see typecheck.log.
- changed: + src/features/tasks/mark-done-button.tsx, ~ src/features/tasks/api.ts, ~ src/features/tasks/task-list.tsx

**T20-mark-done · reference-deepseek · rep 1** — solved, 1.0 min
- shape: bash(read) → read×6 → bash → write → edit → bash(verify)
- Changed directory 2 times; the cwd is already the project.
- Clean run: few turns, straight to the edit.
- changed: + src/features/tasks/mark-done-button.tsx, ~ src/features/tasks/task-list.tsx

**T20-mark-done-ru · base-harness · rep 1** — failed: typecheck, 30.0 min
- shape: bash(read) → read×4 → edit → write → bash(read)! → bash(read) → write×2 → edit! → read → edit → bash(read) → write → bash(read)×2 → bash(verify)×2 → bash → bash(verify)×2 → bash×2 → bash(read) → bash×3 → bash(verify)×2 → bash×9 → bash(read)×7 → bash×3
- Timed out after 30 min without finishing.
- Read files through bash 14 times (cat/grep/sed) versus 5 read calls.
- 1 failed edit/write calls (wrong path or oldText not found).
- Used absolute paths in 46 calls; the tools take paths relative to the project.
- Changed directory 24 times; the cwd is already the project.
- Ran verification 6 times.
- Kept working 27.3 min after the last edit.
- 49 turns for a difficulty 2 task.
- 0.61M input tokens processed: the context grew large and was re-sent every turn.
- Result does not typecheck: see typecheck.log.
- changed: + src/features/tasks/mark-done-button.tsx, ~ src/features/tasks/api.ts, ~ src/features/tasks/task-list.tsx

**T20-mark-done-ru · reference-deepseek · rep 1** — solved, 0.4 min
- shape: bash → read×5 → write → edit → bash(verify)
- Used absolute paths in 9 calls; the tools take paths relative to the project.
- Changed directory 2 times; the cwd is already the project.
- Clean run: few turns, straight to the edit.
- changed: + src/features/tasks/mark-done-button.tsx, ~ src/features/tasks/task-list.tsx

**T21-not-found-path · reference-deepseek · rep 1** — solved, 0.6 min
- shape: bash(read) → read → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/not-found-page.tsx

**T22-edit-heading · reference-deepseek · rep 1** — solved, 0.6 min
- shape: bash(read) → read → edit → bash(read) → bash(verify) → bash(read)
- Read files through bash 3 times (cat/grep/sed) versus 1 read calls.
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/task-edit-page.tsx

**T23-required-description · reference-deepseek · rep 1** — solved, 1.6 min
- shape: bash(read) → read×6 → edit×2 → bash(read) → edit → bash(read) → bash(verify) → read → edit → bash(read) → read → bash(verify)
- changed: ~ src/features/tasks/api.test.ts, ~ src/features/tasks/model.ts, ~ src/mocks/db.ts, ~ src/pages/task-new-page.test.tsx

**T24-task-labels · reference-deepseek · rep 1** — solved, 3.9 min
- shape: bash(read) → read×7 → bash(read) → read×10 → bash → edit×6 → bash(verify)! → edit → bash(verify)! → bash(verify)
- Used absolute paths in 4 calls; the tools take paths relative to the project.
- Changed directory 4 times; the cwd is already the project.
- changed: ~ src/features/tasks/model.ts, ~ src/features/tasks/task-badges.tsx, ~ src/features/tasks/task-form.test.tsx, ~ src/features/tasks/task-form.tsx, ~ src/features/tasks/task-list.tsx, ~ src/mocks/db.ts

**T24-task-labels-ru · reference-deepseek · rep 1** — solved, 5.1 min
- shape: bash(read) → read×17 → edit×5 → edit! → edit → read → edit! → bash(read)! → bash(read) → edit → bash(verify)! → edit → bash(verify) → edit! → edit → bash(verify)! → edit×2 → bash(verify)! → edit → bash(verify) → read → edit×2 → bash(verify)! → bash → bash(verify)! → read → edit → bash(verify)! → bash×2 → edit → bash(verify)! → edit → bash(verify)! → edit → bash(verify)! → bash(verify) → read
- 3 failed edit/write calls (wrong path or oldText not found).
- Wrote or read /tmp files 1 times instead of working in the project.
- Repeated identical bash commands 10 times.
- Changed directory 2 times; the cwd is already the project.
- Ran verification 12 times.
- 48 turns for a difficulty 3 task.
- Changed 9 files, the reference solution changes 4.
- changed: ~ src/features/tasks/api.test.ts, ~ src/features/tasks/model.ts, ~ src/features/tasks/task-badges.tsx, ~ src/features/tasks/task-form.test.tsx, ~ src/features/tasks/task-form.tsx, ~ src/features/tasks/task-list.tsx, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts, ~ src/pages/tasks-page.test.tsx

**T25-retry-test · reference-deepseek · rep 1** — failed: format, 0.2 min
- shape: read → edit → bash(verify)
- Only format failed: the code works but ignores project conventions.
- changed: ~ src/pages/tasks-page.test.tsx

**T26-mock-status-filter · reference-deepseek · rep 1** — solved, 0.3 min
- shape: bash(read) → read×3 → edit → bash(verify)
- Used absolute paths in 4 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: ~ src/mocks/handlers.ts

**T27-refresh-button · reference-deepseek · rep 1** — solved, 0.3 min
- shape: bash(read) → read×2 → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/pages/tasks-page.tsx

**T28-default-priority · reference-deepseek · rep 1** — solved, 0.3 min
- shape: bash(read) → read×3 → edit×2 → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-form.test.tsx, ~ src/features/tasks/task-form.tsx

**T29-tasks-redirect · reference-deepseek · rep 1** — solved, 0.5 min
- shape: read → edit → bash(verify) → bash×2 → edit → bash(verify)
- Used absolute paths in 7 calls; the tools take paths relative to the project.
- Changed directory 4 times; the cwd is already the project.
- Clean run: few turns, straight to the edit.
- changed: ~ src/app/router.tsx

**T30-delete-error · reference-deepseek · rep 1** — solved, 0.6 min
- shape: bash(read) → read×2 → bash(read) → read×2 → edit → read → bash(read) → read → bash(read) → edit → bash(verify)
- changed: ~ src/features/tasks/delete-task-button.tsx, ~ src/pages/tasks-page.test.tsx

**T30-delete-error-ru · reference-deepseek · rep 1** — solved, 0.4 min
- shape: bash(read)! → bash(read) → read×2 → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/delete-task-button.tsx

**T31-empty-cta · reference-deepseek · rep 1** — solved, 0.3 min
- shape: bash(read) → read → edit → bash(verify)
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-list.tsx

**T32-projects-feature · reference-deepseek · rep 1** — solved, 1.5 min
- shape: bash(read) → read×15 → write×3 → edit → write×3 → edit×5 → write×4 → bash(verify)! → edit → bash(verify)! → bash → bash(verify)
- Changed 15 files, the reference solution changes 11.
- changed: + src/features/projects/api.test.ts, + src/features/projects/api.ts, + src/features/projects/model.ts, + src/features/projects/project-form.test.tsx, + src/features/projects/project-form.tsx, + src/features/projects/project-list.tsx, + src/pages/project-new-page.test.tsx, + src/pages/project-new-page.tsx, + src/pages/projects-page.test.tsx, + src/pages/projects-page.tsx, ~ src/api/base-api.ts, ~ src/app/root-layout.tsx, ~ src/app/router.tsx, ~ src/mocks/db.ts, ~ src/mocks/handlers.ts

**T33-form-edit-test · reference-deepseek · rep 1** — solved, 0.2 min
- shape: read×2 → edit → bash(verify)
- Used absolute paths in 4 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: ~ src/features/tasks/task-form.test.tsx

**T34-env-app-name · reference-deepseek · rep 1** — solved, 0.4 min
- shape: read×2 → bash(read) → read×2 → edit×4 → bash(verify)
- Used absolute paths in 10 calls; the tools take paths relative to the project.
- Clean run: few turns, straight to the edit.
- changed: ~ .env.development, ~ .env.test, ~ src/app/root-layout.tsx, ~ src/env.d.ts

**T35-shadcn-tooltip · reference-deepseek · rep 1** — solved, 1.5 min
- shape: bash → bash(read)×2 → read×2 → bash(read)×2 → bash(verify) → bash(verify)! → bash(read) → edit×2 → bash → bash(verify)! → read → edit → bash(verify)! → read → edit → bash(verify)
- Read files through bash 7 times (cat/grep/sed) versus 4 read calls.
- Ran verification 5 times.
- changed: + src/components/ui/tooltip.tsx, ~ src/app/app.tsx, ~ src/features/tasks/delete-task-button.tsx, ~ src/test/render.tsx

**T36-eslint-curly · reference-deepseek · rep 1** — solved, 1.4 min
- shape: bash(read) → bash(verify) → read → bash(read)×2 → bash → read×2 → bash(verify) → bash(verify)!×2 → edit×3 → bash(verify)×7 → bash(verify)! → bash(verify)×3 → edit → bash(verify)×2 → read
- Used absolute paths in 16 calls; the tools take paths relative to the project.
- Wrote or read /tmp files 2 times instead of working in the project.
- Changed directory 16 times; the cwd is already the project.
- Ran verification 17 times.
- changed: ~ eslint.config.js, ~ src/main.tsx, ~ src/mocks/db.ts

**T37-split-handlers · reference-deepseek · rep 1** — solved, 0.3 min
- shape: read → bash(read) → bash → write×2 → bash(verify)
- Used absolute paths in 6 calls; the tools take paths relative to the project.
- Changed directory 2 times; the cwd is already the project.
- Clean run: few turns, straight to the edit.
- changed: + src/mocks/handlers/tasks.ts, ~ src/mocks/handlers.ts
