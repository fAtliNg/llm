# bench

Benchmark harness for the local vibe-coding experiment. See `../docs/09-benchmark.md` for the design and `../docs/10-setup.md` for the local setup.

```bash
npx npm@latest install
npm run bench -- list
npm run bench -- validate all          # reference solutions pass
npm run bench -- null all              # untouched template fails
npm run bench -- run --configs base-harness --tasks T00-rename-button --reps 1
npm run bench -- report
```

Full base measurement, resumable:

```bash
# start (or continue) the run named base-v1; finished (config, task, rep) triples are skipped
nohup npm run bench -- run --run-id base-v1 --configs base-harness,base-bare,base-harness-thinking --tasks all --reps 1 > results/base-v1.log 2>&1 &
echo $! > results/base-v1.pid
tail -f results/base-v1.log            # watch progress
kill $(cat results/base-v1.pid)        # stop: the running agent is killed, finished tasks are kept
npm run bench -- report --run-id base-v1
```

Each finished run leaves `results/<run>/<config>/<task>/<rep>/` with `result.json`, `analysis.md`
(what happened and why, for shaping the dataset), `transcript.jsonl`, verify logs and the Pi session.

Other commands:

```bash
npm run bench -- regrade --run-id base-v1 --tasks T07-contacts-feature   # re-grade after a task's tests changed
npm run bench -- rediagnose --run-id base-v1                              # recompute analysis.md
npm run bench -- report --run-id base-v1,reference-deepseek-v1            # combine selected runs
node src/dataset/convert.ts reference-deepseek-v1 dataset/examples.jsonl  # solved runs → training examples
```

Cloud configs read their keys from the environment: `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`.

Tasks live in `tasks/<id>/`, configurations in `configs/`, Pi's provider config in `pi-home/`. Results go to `results/<runId>/...` and workspaces to `.work/`, both ignored by git.
