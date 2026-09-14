import http from 'node:http';
import { Readable } from 'node:stream';

/**
 * Local proxy for the Gemini API that respects the free tier: at most one request every
 * `intervalMs`, and a 429 is retried after the delay Google asks for. Pi points at it through
 * the `google-throttled` provider in pi-home/models.json.
 */
const UPSTREAM = 'https://generativelanguage.googleapis.com';
const HOP_BY_HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);

export function startGeminiProxy(port = 8787, intervalMs = 12_500): Promise<() => void> {
  let nextSlot = 0;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const acquireSlot = async () => {
    const now = Date.now();
    const at = Math.max(now, nextSlot);
    nextSlot = at + intervalMs;
    if (at > now) await wait(at - now);
  };

  const server = http.createServer((req, res) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      const headers: Record<string, string> = {};
      for (const [name, value] of Object.entries(req.headers)) {
        if (!HOP_BY_HOP.has(name) && typeof value === 'string') headers[name] = value;
      }
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await acquireSlot();
        const upstream = await fetch(`${UPSTREAM}${req.url ?? '/'}`, {
          method: req.method,
          headers,
          body: body.length > 0 ? body : undefined,
        });
        if (upstream.status === 429 && attempt < 5) {
          const text = await upstream.text();
          const seconds = Number(/retry in ([\d.]+)s/i.exec(text)?.[1] ?? '60');
          console.error(`[gemini-proxy] 429, waiting ${seconds.toFixed(0)}s (attempt ${String(attempt)})`);
          await wait(seconds * 1000 + 1000);
          continue;
        }
        res.statusCode = upstream.status;
        upstream.headers.forEach((value, name) => {
          if (!HOP_BY_HOP.has(name) && name !== 'content-encoding') res.setHeader(name, value);
        });
        if (upstream.body) Readable.fromWeb(upstream.body as never).pipe(res);
        else res.end();
        return;
      }
    })().catch((error: unknown) => {
      res.statusCode = 502;
      res.end(String(error));
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      console.log(`[gemini-proxy] listening on http://127.0.0.1:${String(port)}, one request per ${String(intervalMs / 1000)}s`);
      resolve(() => server.close());
    });
  });
}

if (process.argv[1]?.endsWith('gemini-proxy.ts')) {
  void startGeminiProxy();
}
