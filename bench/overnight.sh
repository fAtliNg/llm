#!/bin/zsh
# Overnight runs: base model on all benchmark tasks (resumes base-v1) and the teacher on the task pool.
# Usage: DEEPSEEK_API_KEY=... ./overnight.sh
# Both runs are resumable; rerun the script to continue after a stop.
set -u
cd "$(dirname "$0")"
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
mkdir -p results

if [[ -z "${DEEPSEEK_API_KEY:-}" ]]; then
  echo "DEEPSEEK_API_KEY is not set; the teacher run will be skipped" >&2
fi

# 1. Wait for a running base-v1 to finish (it holds a lock file while alive).
if [[ -f results/base-v1/.lock ]] && kill -0 "$(cat results/base-v1/.lock)" 2>/dev/null; then
  echo "base-v1 is still running (pid $(cat results/base-v1/.lock)); waiting for it..."
  while kill -0 "$(cat results/base-v1/.lock)" 2>/dev/null; do sleep 60; done
fi

# 2. Base on every benchmark task, all three configs, one rep (finished triples are skipped).
nohup node src/cli.ts run --run-id base-v1 --configs base-harness,base-bare,base-harness-thinking --tasks all --reps 1 >> results/base-v1.log 2>&1 &
BASE=$!
echo $BASE > results/base-v1.pid
nohup caffeinate -i -s -w $BASE >/dev/null 2>&1 &
echo "base-v1 resumed, pid $BASE"

# 3. Teacher on the whole pool (cloud model, only CPU for grading), in parallel.
if [[ -n "${DEEPSEEK_API_KEY:-}" ]]; then
  BENCH_TASKS_DIR="$PWD/pool/tasks" nohup node src/cli.ts run --run-id teacher-v1 --configs reference-deepseek --tasks all --reps 1 >> results/teacher-v1.log 2>&1 &
  TEACHER=$!
  echo $TEACHER > results/teacher-v1.pid
  nohup caffeinate -i -s -w $TEACHER >/dev/null 2>&1 &
  echo "teacher-v1 started, pid $TEACHER"
fi

echo "logs: results/base-v1.log, results/teacher-v1.log"
echo "stop: kill \$(cat results/base-v1.pid) ; kill \$(cat results/teacher-v1.pid)"
