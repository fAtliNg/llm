#!/usr/bin/env python3
"""
Live guard for unsandboxed runs on a personal machine. Watches the transcripts of a run and stops the
runner the moment the model under test reaches outside its workspace or onto the network.

  python3 tools/guard.py <run-id>

Violations: a tool call that references an absolute path outside bench/.work/<run-id> (system read-only
locations such as /dev/null, /usr, /bin, /opt/homebrew, node's own paths are allowed), `cd` out of the
workspace, network or privilege commands (curl, wget, ssh, scp, nc, sudo), and destructive commands aimed
outside the workspace. On violation the runner and its keeper are killed and the reason is logged.
"""
import json, os, re, signal, subprocess, sys, time

run = sys.argv[1]
bench = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = os.path.join(bench, "results", run)
work = os.path.join(bench, ".work", run)
log = os.path.join(bench, "results", f"{run}.guard.log")
ALLOWED = ("/dev/", "/usr/", "/bin/", "/sbin/", "/opt/homebrew/", "/private/var/folders/", "/var/folders/", "/tmp/", "/private/tmp/", "/etc/")
NET = re.compile(r"(^|[\s;&|(])(curl|wget|ssh|scp|sftp|nc|ncat|telnet|sudo|osascript|open|defaults|launchctl|pbcopy|pbpaste)(\s|$)")
ABS = re.compile(r"(?<![\w.@-])(/(?:Users|home|Volumes|Applications|Library|System|root|mnt)[^\s\"'`;|&)<>]*)")

def say(msg):
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    open(log, "a").write(line + "\n")

def violation(name, args):
    text = json.dumps(args, ensure_ascii=False)
    cmd = args.get("command", "") if name == "bash" else ""
    if cmd and NET.search(cmd):
        return f"network/privileged command: {cmd[:160]}"
    for path in ABS.findall(text):
        real = os.path.normpath(path)
        # Pi's system prompt points at its own docs under bench/node_modules: reading them is harmless.
        if real.startswith(work) or real.startswith(ALLOWED) or real.startswith(os.path.join(bench, "node_modules")):
            continue
        return f"{name} touches a path outside the workspace: {path[:160]}"
    if cmd and re.search(r"(^|[;&|]\s*)cd\s+(\.\./\.\.|~|/)(?!" + re.escape(work) + ")", cmd):
        return f"cd out of the workspace: {cmd[:160]}"
    return None

def stop(reason):
    say(f"VIOLATION, stopping run: {reason}")
    subprocess.run(f"pkill -f '{run} complet[e]'", shell=True)  # keeper
    try:
        pid = int(open(os.path.join(bench, "results", f"{run}.pid")).read())
        os.kill(pid, signal.SIGTERM)
    except Exception as e:
        say(f"could not kill runner: {e}")
    sys.exit(2)

offsets, checked = {}, 0
say(f"guard started for {run}")
while True:
    for root, _, files in os.walk(results):
        if "transcript.jsonl" not in files:
            continue
        f = os.path.join(root, "transcript.jsonl")
        with open(f, "rb") as fh:
            fh.seek(offsets.get(f, 0))
            chunk = fh.read()
            # only consume complete lines
            end = chunk.rfind(b"\n") + 1
            offsets[f] = offsets.get(f, 0) + end
        for raw in chunk[:end].splitlines():
            if b'"toolCall"' not in raw or b'"message_end"' not in raw:
                continue
            try:
                e = json.loads(raw)
            except Exception:
                continue
            for c in e.get("message", {}).get("content", []):
                if c.get("type") == "toolCall":
                    checked += 1
                    why = violation(c.get("name", ""), c.get("arguments", {}) or {})
                    if why:
                        stop(f"{os.path.relpath(root, results)}: {why}")
    runner = os.path.join(bench, "results", f"{run}.pid")
    alive = False
    try:
        os.kill(int(open(runner).read()), 0); alive = True
    except Exception:
        pass
    if not alive and checked:
        keeper = subprocess.run(f"pgrep -f '{run} complet[e]'", shell=True, capture_output=True).stdout.strip()
        if not keeper:
            say(f"run finished, {checked} tool calls checked, no violations"); break
    time.sleep(3)
