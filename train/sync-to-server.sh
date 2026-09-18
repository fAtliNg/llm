#!/usr/bin/env bash
# Copies everything a training day needs to a fresh server: repo (without results, pool, models),
# training scripts and the dataset. Then run on the server: bash /root/bootstrap-server.sh && bash /root/session-v2.sh
#   bash sync-to-server.sh root@HOST [PORT]
set -euo pipefail
HOST="$1"; PORT="${2:-22}"
cd "$(dirname "$0")/.."
rsync -az -e "ssh -p $PORT" --exclude node_modules --exclude .git --exclude 'bench/results' --exclude 'bench/.work' \
  --exclude 'bench/pool' --exclude 'bench/dataset' --exclude 'bench/reports' --exclude 'bench/.env.local' \
  --exclude 'bench/pi-home/auth.json' --exclude 'bench/pi-home/sessions' --exclude 'bench/pi-home/bin' \
  --exclude 'train/models' --exclude 'train/out' --exclude 'train/venv' --exclude 'template-fullstack/data' \
  --exclude 'bench/pool-fs/setups' --exclude 'bench/pool-fs/tasks' ./ "$HOST:/root/llm/"
# Pilot pool tasks only (for the local-teacher check), not the whole pool.
if [[ -f bench/pilot-fs.txt ]]; then
  ssh -p "$PORT" "$HOST" 'mkdir -p /root/llm/bench/pool-fs/tasks'
  for t in $(tr ',' ' ' < bench/pilot-fs.txt); do rsync -az -e "ssh -p $PORT" "bench/pool-fs/tasks/$t" "$HOST:/root/llm/bench/pool-fs/tasks/"; done
fi
scp -P "$PORT" train/train.py train/bootstrap-server.sh train/session-v2.sh "$HOST:/root/"
[[ -f train/train-v2.jsonl ]] && scp -P "$PORT" train/train-v2.jsonl "$HOST:/root/train-v2.jsonl"
echo "synced. Next: ssh -p $PORT $HOST 'bash /root/bootstrap-server.sh && nohup bash /root/session-v2.sh > /root/session.log 2>&1 &'"
