# Sandbox for benchmark runs on a personal machine: the agent under test gets bash only inside this
# container. Nothing from the host is mounted except one results directory for the current run.
# Build from the repo root:   docker build -f bench/docker/Dockerfile -t llm-bench .
# Ollama stays on the host (GPU); the container reaches it at host.docker.internal:11434.
FROM node:22-bookworm-slim
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends git ripgrep procps ca-certificates >/dev/null && rm -rf /var/lib/apt/lists/*
WORKDIR /work/llm
COPY --chown=node:node template ./template
COPY --chown=node:node bench ./bench
RUN chown -R node:node /work
USER node
RUN cd template && npm ci --silent && cd ../bench && npm ci --silent
# Pi talks to Ollama on the host
RUN sed -i 's#http://localhost:11434#http://host.docker.internal:11434#g; s#http://127.0.0.1:11434#http://host.docker.internal:11434#g' bench/pi-home/models.json && grep -o 'http://[a-z.0-9:]*11434[^"]*' bench/pi-home/models.json | sort -u
# The agent runs as `node`. The template and the bench sources belong to root and are read-only for it,
# so a confused model cannot wreck later tasks by deleting them; only the work, results and Pi state
# directories are writable.
USER root
RUN chown -R root:root /work/llm/template /work/llm/bench \
 && mkdir -p /work/llm/bench/.work /work/llm/bench/results \
 && chown -R node:node /work/llm/bench/.work /work/llm/bench/results /work/llm/bench/pi-home \
 && chmod -R a+rX /work/llm
USER node
WORKDIR /work/llm/bench
ENV PI_OFFLINE=1 PI_SKIP_VERSION_CHECK=1 PI_TELEMETRY=0
CMD ["node", "src/cli.ts", "list"]
