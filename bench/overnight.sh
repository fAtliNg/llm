#!/bin/zsh
# Overnight runs: base model on all benchmark tasks (resumes base-v1) and the teacher on the task pool.
# Usage: DEEPSEEK_API_KEY=... ./overnight.sh
# Both runs are resumable; rerun the script to continue after a stop.
set -u
setopt nonomatch
cd "$(dirname "$0")"
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
mkdir -p results

if [[ -z "${DEEPSEEK_API_KEY:-}" ]]; then
  echo "DEEPSEEK_API_KEY is not set; the teacher run will be skipped" >&2
fi

# 1. Wait for a running base-v1 to finish: check the lock file and the pid file, and any
#    process that still carries the run id on its command line.
running_base() {
  for f in results/base-v1/.lock results/base-v1.pid; do
    [[ -f $f ]] && kill -0 "$(cat $f)" 2>/dev/null && return 0
  done
  pgrep -f "run-id base-v1" >/dev/null 2>&1
}
if running_base; then
  echo "base-v1 is still running; waiting for it..."
  while running_base; do sleep 60; done
fi

# 2. Base on every benchmark task, all three configs, one rep (finished triples are skipped).
nohup node src/cli.ts run --run-id base-v1 --configs base-harness,base-bare,base-harness-thinking --tasks all --reps 1 >> results/base-v1.log 2>&1 &
BASE=$!
echo $BASE > results/base-v1.pid
nohup caffeinate -i -s -w $BASE >/dev/null 2>&1 &
echo "base-v1 resumed, pid $BASE"

# 3. Teacher on the whole pool (cloud model, only CPU for grading), in parallel.
#    First expand the pool with paraphrases once (skipped if -p1 directories already exist).
if [[ -n "${DEEPSEEK_API_KEY:-}" ]]; then
  if ! ls -d pool/tasks/*-p1 >/dev/null 2>&1; then
    echo "paraphrasing the pool (2 per task)..."
    node src/dataset/paraphrase.ts pool/tasks 2 2>&1 | tail -2
  fi
  BENCH_TASKS_DIR="$PWD/pool/tasks" nohup node src/cli.ts run --run-id teacher-v1 --configs reference-deepseek --tasks all --reps 1 >> results/teacher-v1.log 2>&1 &
  TEACHER=$!
  echo $TEACHER > results/teacher-v1.pid
  nohup caffeinate -i -s -w $TEACHER >/dev/null 2>&1 &
  echo "teacher-v1 started, pid $TEACHER"
fi

echo "logs: results/base-v1.log, results/teacher-v1.log"
echo "stop: kill \$(cat results/base-v1.pid) ; kill \$(cat results/teacher-v1.pid)"
