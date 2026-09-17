#!/usr/bin/env bash
# One paid session on the GPU stand for small Qwen3.5 models: fine-tune on the v1.1 dataset, export GGUF,
# register base and fine-tuned models in Ollama, benchmark both on the first N tasks.
#   SIZES="2b" bash small-session.sh            # default: only 2B
#   SIZES="2b 4b" TASKS_N=76 bash small-session.sh
# Expects /root/venv, /root/train.py, /root/train.jsonl and the repo in /root/llm (as set up on 2026-09-15).
set -uo pipefail
SIZES="${SIZES:-2b}"; TASKS_N="${TASKS_N:-20}"; PARALLEL="${PARALLEL:-4}"
cd /root
source venv/bin/activate
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
log() { echo "[$(date +%H:%M:%S)] $*"; }
hf_name() { case "$1" in 2b) echo "Qwen/Qwen3.5-2B";; 4b) echo "Qwen/Qwen3.5-4B";; 0.8b) echo "Qwen/Qwen3.5-0.8B";; esac; }
# Ollama's default tag is Q8_0 for 2B and below, Q4_K_M for 4B: export the same format for a fair comparison.
quant() { case "$1" in 4b) echo "q4_k_m";; *) echo "q8_0";; esac; }
ggufglob() { case "$1" in 4b) echo "*Q4_K_M.gguf";; *) echo "*Q8_0.gguf";; esac; }

log "== 1. Ollama base models (background) and training: $SIZES"
( for s in $SIZES; do ollama pull "qwen3.5:$s" >/dev/null 2>&1; done; log "ollama base models pulled" ) &
PULL=$!
PIDS=()
for s in $SIZES; do
  python train.py --data train.jsonl --base "$(hf_name $s)" --out "out/$s-v1.1" --max-seq 32768 --gguf "$(quant $s)" > "train-$s.out" 2>&1 &
  PIDS+=($!)
done
for p in "${PIDS[@]}"; do wait "$p"; log "training+export process $p finished (exit $?)"; done
wait $PULL

log "== 2. Ollama models"
mk() { printf 'FROM %s\nPARAMETER num_ctx 32768\nPARAMETER num_thread 4\n%b' "$2" "$3" > "/root/Modelfile-${1//[:\/]/_}"; ollama create "$1" -f "/root/Modelfile-${1//[:\/]/_}" 2>&1 | tail -1; }
FT='RENDERER qwen3.5\nPARSER qwen3.5\nPARAMETER temperature 0.7\nPARAMETER top_p 0.8\nPARAMETER top_k 20\nPARAMETER presence_penalty 1.0\n'
for s in $SIZES; do
  mk "qwen3.5:$s-32k" "qwen3.5:$s" ""
  G=$(ls /root/out/$s-v1.1/*_gguf/$(ggufglob $s) 2>/dev/null | head -1)
  if [ -n "$G" ]; then mk "qwen3.5-$s-agent:v1.1" "$G" "$FT"; else log "GGUF for $s missing, see train-$s.out"; fi
done
ollama list | grep -E "$(echo $SIZES | tr ' ' '|')"

log "== 3. benchmark: base and fine-tuned, first $TASKS_N tasks, $PARALLEL agents per run"
cd /root/llm/bench
TASKS=$(ls tasks | sort | head -"$TASKS_N" | paste -sd, -)
for s in $SIZES; do for kind in base ft; do
  cfg="${kind}${s}-harness"
  [ -f "configs/$cfg.json" ] || { log "config $cfg missing"; continue; }
  rm -f "results/small-$cfg/.lock"
  nohup node src/cli.ts run --run-id "small-$cfg" --configs "$cfg" --tasks "$TASKS" --reps 1 --parallel "$PARALLEL" >> "results/small-$cfg.log" 2>&1 < /dev/null &
  echo $! > "results/small-$cfg.pid"
done; done
log "benchmarks started; logs: /root/llm/bench/results/small-*.log"
