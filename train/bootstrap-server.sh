#!/usr/bin/env bash
# Fresh Ubuntu 24.04 GPU server -> ready stand: Python venv with torch (CUDA 12.8), unsloth, Ollama with
# the stand settings, Node 22, npm deps for template and bench. Idempotent: safe to re-run.
# Before running, copy from the Mac:  train.py run.sh small-session.sh train.jsonl -> /root,  repo -> /root/llm
set -uo pipefail
export DEBIAN_FRONTEND=noninteractive
log() { echo "[$(date +%H:%M:%S)] $*"; }
cd /root
log "apt packages"; apt-get update -qq && apt-get install -y -qq python3-venv python3-pip python3-dev build-essential git rsync curl >/dev/null
( # Python side in the background: it is the longest part
  if [[ ! -x venv/bin/python ]]; then python3 -m venv venv; fi
  source venv/bin/activate
  python -c "import unsloth" 2>/dev/null || { pip install -q --upgrade pip; pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu128; pip install -q unsloth unsloth_zoo "transformers>=5" "trl>=0.22" datasets huggingface_hub; }
  python - <<'PY'
import torch, transformers, unsloth
print(f"torch {torch.__version__}, transformers {transformers.__version__}, unsloth {unsloth.__version__}, gpu {torch.cuda.get_device_name(0)}")
PY
) > bootstrap-python.log 2>&1 &
PY_PID=$!
log "ollama"; command -v ollama >/dev/null || curl -fsSL https://ollama.com/install.sh | sh >/dev/null 2>&1
mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\nEnvironment="OLLAMA_NUM_PARALLEL=6"\nEnvironment="OLLAMA_KEEP_ALIVE=24h"\nEnvironment="OLLAMA_MAX_LOADED_MODELS=4"\n' > /etc/systemd/system/ollama.service.d/override.conf
systemctl daemon-reload && systemctl restart ollama
log "node 22"; command -v node >/dev/null || { curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1; apt-get install -y -qq nodejs >/dev/null; }
node --version
if [[ -d /root/llm/bench ]]; then
  log "npm ci"; (cd /root/llm/template && npm ci --silent 2>&1 | tail -1); (cd /root/llm/template-fullstack && npm ci --silent 2>&1 | tail -1); (cd /root/llm/bench && npm ci --silent 2>&1 | tail -1)
  # Timeouts stay as in the configs (15 minutes for the full-stack iteration: the model must fit in that on a laptop).
  (cd /root/llm/bench && node src/cli.ts validate F01-due-date 2>&1 | grep -E "^(PASS|FAIL)")
else
  log "repo not found in /root/llm: rsync it from the Mac, then re-run"
fi
wait $PY_PID; tail -2 bootstrap-python.log
log "bootstrap done"
