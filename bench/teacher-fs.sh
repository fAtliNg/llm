#!/bin/zsh
# Teacher run on the full-stack pool: DeepSeek through Pi, only outside DeepSeek's peak hours
# (weekdays 04:00-07:00 and 09:00-13:00 Moscow time cost double). Resumable; safe to re-run.
#   ./teacher-fs.sh            starts the loop in the background
#   kill $(cat results/teacher-fs-v1.loop.pid)   stops it (the current agents are killed, finished tasks stay)
# Needs bench/.env.local with DEEPSEEK_API_KEY.
set -u
cd "$(dirname "$0")"
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
R=teacher-fs-v1
PARALLEL="${PARALLEL:-4}"
# Which tasks: all, ids, tag:<tag>, difficulty:<n>. Stage 3 first when the budget is tight: TASKS=difficulty:3 ./teacher-fs.sh
TASKS="${TASKS:-all}"
[[ -f .env.local ]] && set -a && source .env.local && set +a
[[ -z "${DEEPSEEK_API_KEY:-}" ]] && { echo "DEEPSEEK_API_KEY is not set (bench/.env.local)"; exit 1; }
mkdir -p results

is_peak() { # Moscow = UTC+3; peak = Mon-Fri 01-04 and 06-10 UTC
  local dow=$(date -u +%u) h=$(date -u +%-H)
  (( dow <= 5 )) && { (( h >= 1 && h < 4 )) || (( h >= 6 && h < 10 )); }
}
alive() { [[ -f results/$R.pid ]] && kill -0 "$(cat results/$R.pid)" 2>/dev/null; }
start() {
  rm -f results/$R/.lock
  BENCH_TASKS_DIR="$PWD/pool-fs/tasks" nohup node src/cli.ts run --run-id $R --configs reference-deepseek --tasks "$TASKS" --reps 1 --parallel $PARALLEL >> results/$R.log 2>&1 &
  echo $! > results/$R.pid
  nohup caffeinate -i -s -w $(cat results/$R.pid) >/dev/null 2>&1 &
  echo "$(date '+%d.%m %H:%M') started, pid $(cat results/$R.pid)"
}
loop() {
  while true; do
    if is_peak; then
      alive && { echo "$(date '+%d.%m %H:%M') peak hours: pausing"; kill "$(cat results/$R.pid)"; }
    elif ! alive; then
      if tail -3 results/$R.log 2>/dev/null | grep -q "^results:"; then echo "$(date '+%d.%m %H:%M') complete"; break; fi
      if tail -5 results/$R.log 2>/dev/null | grep -q "provider error"; then echo "$(date '+%d.%m %H:%M') provider error (balance? key?), not restarting"; break; fi
      start
    fi
    sleep 300
  done
}
loop >> results/$R.loop.log 2>&1 &
echo $! > results/$R.loop.pid
echo "teacher loop started (pid $(cat results/$R.loop.pid)); log: results/$R.loop.log"
