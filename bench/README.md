# bench

Benchmark harness for the local vibe-coding experiment. See `../docs/09-benchmark.md` for the design and `../docs/10-setup.md` for the local setup.

```bash
npx npm@latest install
npm run bench -- list
npm run bench -- validate all          # reference solutions pass
npm run bench -- null all              # untouched template fails
npm run bench -- run --config base-harness --tasks T00-rename-button --reps 1
npm run bench -- report
```

Tasks live in `tasks/<id>/`, configurations in `configs/`, Pi's provider config in `pi-home/`. Results go to `results/<runId>/...` and workspaces to `.work/`, both ignored by git.
