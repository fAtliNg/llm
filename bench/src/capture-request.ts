import fs from 'node:fs';
import http from 'node:http';

/**
 * Fake OpenAI-compatible server that records the first chat request Pi sends (system prompt,
 * tool schemas, messages) to a file and answers with an error so the agent stops. Used to
 * capture the exact prompt format the student model sees, for building training examples.
 */
const port = Number(process.env.CAPTURE_PORT ?? '8790');
const out = process.env.CAPTURE_FILE ?? 'captured-request.json';

http
  .createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      if (req.method === 'POST') {
        fs.writeFileSync(out, Buffer.concat(chunks).toString());
        console.log(`[capture] wrote ${out}`);
      }
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'captured, stopping' } }));
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`[capture] listening on ${String(port)}`));
