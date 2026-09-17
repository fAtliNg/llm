#!/usr/bin/env bash
# One paid session on the GPU stand for small Qwen3.5 models.
# Base-model benchmarks start immediately and run alongside training (they do not depend on it);
# fine-tuned benchmarks start as soon as each model is exported. All runs walk the same sorted task
# list, so whatever prefix completes is comparable across models.
#   SIZES="2b 4b" bash small-session.sh
# Expects /root/venv, /root/train.py, /root/train.jsonl and the repo in /root/llm.
set -uo pipefail
SIZES="${SIZES:-2b 4b}"; TASKS_N="${TASKS_N:-76}"; PARALLEL="${PARALLEL:-3}"
cd /root
source venv/bin/activate
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
log() { echo "[$(date +%H:%M:%S)] $*"; }
hf_name() { case "$1" in 2b) echo "Qwen/Qwen3.5-2B";; 4b) echo "Qwen/Qwen3.5-4B";; 0.8b) echo "Qwen/Qwen3.5-0.8B";; esac; }
# Ollama's default tag is Q8_0 for 2B and below, Q4_K_M for 4B: export the same format for a fair comparison.
quant() { case "$1" in 4b) echo "q4_k_m";; *) echo "q8_0";; esac; }
ggufglob() { case "$1" in 4b) echo "*Q4_K_M.gguf";; *) echo "*Q8_0.gguf";; esac; }
# Four models stay loaded at once; two busy threads each keeps the CPU for grading.
mk() { printf 'FROM %s\nPARAMETER num_ctx 32768\nPARAMETER num_thread 2\n%b' "$2" "$3" > "/root/Modelfile-${1//[:\/]/_}"; ollama create "$1" -f "/root/Modelfile-${1//[:\/]/_}" 2>&1 | tail -1; }
FT='RENDERER qwen3.5\nPARSER qwen3.5\nPARAMETER temperature 0.7\nPARAMETER top_p 0.8\nPARAMETER top_k 20\nPARAMETER presence_penalty 1.0\n'
TASKS=$(ls /root/llm/bench/tasks | sort | head -"$TASKS_N" | paste -sd, -)
bench() { # config name
  cd /root/llm/bench
  [ -f "configs/$1.json" ] || { log "config $1 missing"; return; }
  rm -f "results/small-$1/.lock"
  nohup node src/cli.ts run --run-id "small-$1" --configs "$1" --tasks "$TASKS" --reps 1 --parallel "$PARALLEL" >> "results/small-$1.log" 2>&1 < /dev/null &
  echo $! > "results/small-$1.pid"; log "benchmark small-$1 started (pid $!)"; cd /root
}

log "== 0. Ollama: room for four models and enough request slots"
printf '[Service]\nEnvironment="OLLAMA_NUM_PARALLEL=6"\nEnvironment="OLLAMA_KEEP_ALIVE=24h"\nEnvironment="OLLAMA_MAX_LOADED_MODELS=4"\n' > /etc/systemd/system/ollama.service.d/override.conf
systemctl daemon-reload && systemctl restart ollama && sleep 4

log "== 1. training in the background: $SIZES"
declare -A TPID
for s in $SIZES; do
  python train.py --data train.jsonl --base "$(hf_name $s)" --out "out/$s-v1.1" --max-seq 32768 --gguf "$(quant $s)" > "train-$s.out" 2>&1 &
  TPID[$s]=$!
done

log "== 2. base models and their benchmarks (run alongside training)"
for s in $SIZES; do
  ollama pull "qwen3.5:$s" >/dev/null 2>&1 && mk "qwen3.5:$s-32k" "qwen3.5:$s" "" && bench "base$s-harness"
done

log "== 3. fine-tuned models: benchmark each as soon as its export is done"
for s in $SIZES; do
  wait "${TPID[$s]}"; log "$s training+export finished (exit $?)"
  G=$(ls /root/out/$s-v1.1/*_gguf/$(ggufglob $s) 2>/dev/null | head -1)
  if [ -n "$G" ]; then mk "qwen3.5-$s-agent:v1.1" "$G" "$FT" && bench "ft$s-harness"; else log "GGUF for $s missing, see train-$s.out"; fi
done
ollama list | grep -E "$(echo $SIZES | tr ' ' '|')"
log "all started; logs: /root/llm/bench/results/small-*.log"
