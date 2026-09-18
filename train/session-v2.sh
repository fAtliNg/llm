#!/usr/bin/env bash
# One rented day on a 48 GB card (RTX 4090 48 GB / L40S) for the full-stack iteration:
# train 4B on the v2 dataset, export GGUF, benchmark v2 with three attempts; then the same for 9B.
# Base 4B/9B on the same card and the local-teacher candidate (35B-A3B) run on the side when asked.
#
#   bash session-v2.sh                  # 4B then 9B, benchmarks after each export
#   SIZES="4b" bash session-v2.sh       # only 4B
#   WITH_BASE=1 bash session-v2.sh      # also benchmark the base models on this card
#   WITH_TEACHER=1 bash session-v2.sh   # also try Qwen3.5-35B-A3B on the pilot tasks (local teacher candidate)
#
# Expects (bootstrap-server.sh + fetch-and-install.sh do this): /root/venv, /root/train.py,
# /root/train-v2.jsonl, the repo in /root/llm with node_modules, Ollama installed.
# Everything is resumable: re-running skips finished training (out/*/gguf exists) and finished tasks.
set -uo pipefail
SIZES="${SIZES:-4b 9b}"; PARALLEL="${PARALLEL:-4}"; REPS="${REPS:-3}"
DATA="${DATA:-/root/train-v2.jsonl}"
cd /root
source venv/bin/activate
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
log() { echo "[$(date +%H:%M:%S)] $*"; }
hf_name() { case "$1" in 9b) echo "Qwen/Qwen3.5-9B";; 4b) echo "Qwen/Qwen3.5-4B";; 2b) echo "Qwen/Qwen3.5-2B";; esac; }
# Ollama's default tag is Q4_K_M for 4B and 9B, Q8_0 for 2B: export the same format for a fair comparison.
quant() { case "$1" in 2b) echo "q8_0";; *) echo "q4_k_m";; esac; }
ggufglob() { case "$1" in 2b) echo "*Q8_0.gguf";; *) echo "*Q4_K_M.gguf";; esac; }
# 48 GB: 4B trains at the full 32k; 9B in bf16 needs the sequence capped (weights alone are 18 GB).
maxseq() { case "$1" in 9b) echo "${MAX_SEQ_9B:-24576}";; *) echo 32768;; esac; }
FT='RENDERER qwen3.5\nPARSER qwen3.5\nPARAMETER temperature 0.7\nPARAMETER top_p 0.8\nPARAMETER top_k 20\nPARAMETER presence_penalty 1.0\n'
mk() { printf 'FROM %s\nPARAMETER num_ctx 32768\nPARAMETER num_thread 2\n%b' "$2" "$3" > "/root/Modelfile-${1//[:\/]/_}"; ollama create "$1" -f "/root/Modelfile-${1//[:\/]/_}" 2>&1 | tail -1; }

bench() { # run-id config [tasks]
  local id="$1" cfg="$2" tasks="${3:-tag:v2}"
  cd /root/llm/bench
  [ -f "configs/$cfg.json" ] || { log "config $cfg missing"; cd /root; return; }
  rm -f "results/$id/.lock"
  nohup node src/cli.ts run --run-id "$id" --configs "$cfg" --tasks "$tasks" --reps "$REPS" --parallel "$PARALLEL" >> "results/$id.log" 2>&1 < /dev/null &
  echo $! > "results/$id.pid"; log "benchmark $id started (pid $!)"; cd /root
}
wait_pid() { while kill -0 "$1" 2>/dev/null; do sleep 60; done; }

log "== 0. Ollama: several models loaded at once, enough request slots"
mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\nEnvironment="OLLAMA_NUM_PARALLEL=%s"\nEnvironment="OLLAMA_KEEP_ALIVE=24h"\nEnvironment="OLLAMA_MAX_LOADED_MODELS=3"\n' "$PARALLEL" > /etc/systemd/system/ollama.service.d/override.conf
systemctl daemon-reload && systemctl restart ollama && sleep 4
ollama pull qwen3.5:4b >/dev/null 2>&1 && mk qwen3.5:4b-32k qwen3.5:4b ''
ollama pull qwen3.5:9b >/dev/null 2>&1 && mk qwen3.5:9b-32k qwen3.5:9b ''

if [[ "${WITH_BASE:-0}" == "1" ]]; then
  log "== base models on this card (context for the fine-tuned numbers)"
  bench base4b-v2 base4b-mac
fi

for s in $SIZES; do
  OUT="out/$s-v2"
  if ls "$OUT"/*.gguf >/dev/null 2>&1; then
    log "== $s: already trained ($OUT)"
  else
    log "== $s: training on $DATA, max-seq $(maxseq $s)"
    python train.py --data "$DATA" --base "$(hf_name $s)" --out "$OUT" --max-seq "$(maxseq $s)" --gguf "$(quant $s)" > "train-$s-v2.out" 2>&1 \
      || { log "$s: training FAILED, see train-$s-v2.out"; tail -20 "train-$s-v2.out"; continue; }
  fi
  gguf=$(find "$OUT" -name "$(ggufglob $s)" | head -1)
  [ -n "$gguf" ] || { log "$s: no GGUF in $OUT"; continue; }
  mk "qwen3.5-${s}-agent:v2" "$gguf" "$FT"
  cat > "/root/llm/bench/configs/ft${s}-v2.json" <<JSON
{
  "description": "Qwen3.5 $s fine-tuned on dataset v2 (full-stack), harness, 15-minute limit.",
  "model": "ollama/qwen3.5-${s}-agent:v2",
  "thinking": "off",
  "contextFiles": true,
  "skills": true,
  "timeoutSec": 900
}
JSON
  # The model must be listed in pi-home/models.json for the harness to accept it.
  python - "$s" <<'PY'
import json, sys
s = sys.argv[1]
p = "/root/llm/bench/pi-home/models.json"
d = json.load(open(p))
models = d["providers"]["ollama"]["models"]
mid = f"qwen3.5-{s}-agent:v2"
if not any(m["id"] == mid for m in models):
    base = next(m for m in models if m["id"].startswith("qwen3.5:"))
    models.append({**base, "id": mid, "name": f"Qwen3.5 {s} agent v2"})
    json.dump(d, open(p, "w"), indent=2)
PY
  bench "ft${s}-v2" "ft${s}-v2"
  wait_pid "$(cat /root/llm/bench/results/ft${s}-v2.pid)"
  log "== $s: benchmark done"
  (cd /root/llm/bench && node src/cli.ts report --run-id "ft${s}-v2" > /dev/null 2>&1; sed -n '/Attempts and partial/,/Failure reasons/p' "results/report-ft${s}-v2.md")
done

if [[ "${WITH_TEACHER:-0}" == "1" ]]; then
  log "== local teacher candidate: Qwen3.5-35B-A3B on the pilot tasks"
  ollama pull qwen3.5:35b-a3b >/dev/null 2>&1 && mk qwen3.5:35b-a3b-32k qwen3.5:35b-a3b ''
  cat > /root/llm/bench/configs/teacher35b.json <<'JSON'
{ "description": "Qwen3.5-35B-A3B as a local teacher candidate.", "model": "ollama/qwen3.5:35b-a3b-32k", "thinking": "off", "contextFiles": true, "skills": true, "timeoutSec": 900 }
JSON
  REPS=1 BENCH_TASKS_DIR=/root/llm/bench/pool-fs/tasks bench teacher35b-pilot teacher35b "$(cat /root/llm/bench/pilot-fs.txt)"
fi

log "== session script done; benchmarks may still be running: tail -f /root/llm/bench/results/*.log"
