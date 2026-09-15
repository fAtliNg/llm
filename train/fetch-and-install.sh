#!/usr/bin/env bash
# After training finished on the server: download the Q4 GGUF and the adapter, register the model in Ollama.
#   bash train/fetch-and-install.sh root@45.157.161.105 [out/v1] [qwen3.5-9b-agent:v1-q4]
set -euo pipefail
HOST="${1:?server, e.g. root@1.2.3.4}"; REMOTE_OUT="${2:-out/v1}"; TAG="${3:-qwen3.5-9b-agent:v1-q4}"
cd "$(dirname "$0")"
mkdir -p models/v1
echo "== downloading gguf q4_k_m and the adapter"
# Unsloth writes the GGUF next to the export dir, with a _gguf suffix; only the Q4 file is needed.
rsync -ah --info=progress2 --include='*Q4_K_M.gguf' --exclude='*' "$HOST:$REMOTE_OUT/gguf-q4_k_m_gguf/" models/v1/gguf-q4_k_m/
rsync -ah "$HOST:$REMOTE_OUT/lora/" models/v1/lora/
GGUF=$(ls models/v1/gguf-q4_k_m/*Q4_K_M.gguf | head -1)
echo "== gguf: $GGUF ($(du -h "$GGUF" | cut -f1))"
sed "s#^FROM .*#FROM $PWD/$GGUF#" Modelfile > models/v1/Modelfile
ollama create "$TAG" -f models/v1/Modelfile
echo "== smoke"
ollama run "$TAG" "Reply with the single word: ready" | head -3
echo "== done: model $TAG registered. Bench: cd ../bench && node src/cli.ts run --run-id ft-v1 --configs ft-harness,ft-bare --tasks all --reps 1"
