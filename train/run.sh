#!/usr/bin/env bash
# One-command training on a rented GPU (RunPod / Vast, any image with CUDA 12.8+ and Python 3.10+).
#
#   bash run.sh smoke     # ~10 min: install, 20 optimizer steps, no export. Prints seconds per step.
#   bash run.sh full      # 2 epochs, merge, GGUF q4_k_m + q8_0, then packs out/v1/gguf-*.tar
#
# Put train.py and train.jsonl next to this script. Output goes to out/v1/.
set -euo pipefail
cd "$(dirname "$0")"
MODE="${1:-full}"
MAX_SEQ="${MAX_SEQ:-32768}"          # 32768 needs an 80 GB card; use 16384 on 48 GB
OUT="${OUT:-out/v1}"

# Ubuntu 24.04 refuses system-wide pip installs: everything lives in a venv next to the script.
if [[ ! -x venv/bin/python ]]; then
  echo "== creating venv"
  command -v python3 >/dev/null || { echo "python3 missing"; exit 1; }
  python3 -m venv venv 2>/dev/null || { apt-get update -qq && apt-get install -y -qq python3-venv python3-pip >/dev/null && python3 -m venv venv; }
fi
# shellcheck disable=SC1091
source venv/bin/activate
if ! python -c "import unsloth" 2>/dev/null; then
  echo "== installing torch (CUDA 12.8 build, needed for Blackwell), unsloth, transformers v5, trl"
  pip install -q --upgrade pip
  pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu128
  pip install -q "unsloth" "unsloth_zoo" "transformers>=5" "trl>=0.22" "datasets" "huggingface_hub"
fi
python - <<'PY'
import torch, transformers, unsloth
print(f"torch {torch.__version__}, transformers {transformers.__version__}, unsloth {unsloth.__version__}")
print("gpu:", torch.cuda.get_device_name(0), f"{torch.cuda.get_device_properties(0).total_memory/2**30:.0f} GB")
PY

if [[ "$MODE" == "smoke" ]]; then
  python train.py --data train.jsonl --out "$OUT-smoke" --max-seq "$MAX_SEQ" --max-steps 20 --no-export 2>&1 | tee smoke.log
  echo "== smoke done. Look for 'train_runtime' above: full run ≈ (examples*epochs/8) steps × seconds per step."
else
  python train.py --data train.jsonl --out "$OUT" --max-seq "$MAX_SEQ" 2>&1 | tee train.log
  echo "== packing"
  for d in "$OUT"/gguf-*; do tar -cf "$d.tar" -C "$(dirname "$d")" "$(basename "$d")"; done
  ls -la "$OUT"/*.tar
  echo "== done. Download the gguf-q4_k_m.tar (and q8_0 if wanted), then STOP the pod."
fi
