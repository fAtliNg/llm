import fs from 'node:fs';
import path from 'node:path';

import { BENCH_DIR } from '../paths.ts';

/**
 * Expands the pool with paraphrases from DeepSeek: same constraints, different wording and
 * angle (bug report, product request, terse spec). Needs DEEPSEEK_API_KEY. Writes new task
 * directories next to the originals with a -p<n> suffix; run pool.ts first.
 */
const API = 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-pro';

const SYSTEM_EN = `You rewrite coding tasks for a React + TypeScript project. Produce N distinct paraphrases of the task.
Rules: keep every concrete constraint exactly (labels in quotes, file paths, endpoint paths, messages, numbers, field names); change wording, sentence order and framing (a bug report, a product manager's request, a terse engineering ticket, a colleague's chat message); do not add or remove requirements; English only; no preamble.
Output strictly as a JSON array of strings.`;

const SYSTEM_RU = `Ты переписываешь задачи по коду для проекта на React + TypeScript. Сделай N разных формулировок задачи на русском языке, как их написал бы русскоязычный разработчик или продакт: баг-репорт, просьба в чате, короткий тикет.
Правила: все конкретные ограничения сохраняются дословно и остаются на английском (подписи в кавычках, пути к файлам, пути эндпоинтов, тексты сообщений, числа, имена полей и компонентов); нельзя добавлять или убирать требования; без вступлений.
Ответ строго в виде JSON-массива строк.`;

async function paraphrase(prompt: string, n: number, apiKey: string, lang: 'en' | 'ru'): Promise<string[]> {
  const SYSTEM = lang === 'ru' ? SYSTEM_RU : SYSTEM_EN;
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 1.0,
      messages: [
        { role: 'system', content: SYSTEM.replace('N', String(n)) },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`${String(response.status)} ${await response.text()}`);
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message.content ?? '[]';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 20);
}

async function main(): Promise<void> {
  const [poolDir = 'pool/tasks', countArg = '2', lang = 'en'] = process.argv.slice(2) as [string?, string?, ('en' | 'ru')?];
  const suffix = lang === 'ru' ? 'ru' : 'p';
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not set');
  const n = Number(countArg);
  const ids = fs.readdirSync(poolDir).filter((id) => !/-(p\d+|ru\d*)$/.test(id) && fs.existsSync(path.join(poolDir, id, 'prompt.md'))).sort();
  let written = 0;
  const concurrency = Number(process.env.PARAPHRASE_CONCURRENCY ?? '4');
  const queue = ids.filter((id) => !fs.existsSync(path.join(poolDir, `${id}-${suffix}1`)));
  const worker = async (): Promise<void> => {
    for (;;) {
      const id = queue.shift();
      if (!id) return;
      await one(id);
    }
  };
  const one = async (id: string): Promise<void> => {
    // A hand-written Russian variant is the better source for Russian paraphrases: Russian to Russian.
    const handWritten = path.join(poolDir, `${id}-ru`, 'prompt.md');
    const source = lang === 'ru' && fs.existsSync(handWritten) ? handWritten : path.join(poolDir, id, 'prompt.md');
    const prompt = fs.readFileSync(source, 'utf8').trim();
    let variants: string[];
    try {
      variants = await paraphrase(prompt, n, apiKey, lang);
    } catch (error: unknown) {
      console.error(`${id}: ${String(error)}`);
      return;
    }
    const taskMeta = JSON.parse(fs.readFileSync(path.join(poolDir, id, 'task.json'), 'utf8')) as { template?: string };
    const templateRoot = path.join(BENCH_DIR, '..', taskMeta.template === 'fullstack' ? 'template-fullstack' : 'template');
    const setupRoot = path.join(poolDir, id, 'setup');
    const pathsIn = (text: string) => text.match(/\b(?:src|server|shared)\/[A-Za-z0-9_./-]+\.tsx?/g) ?? [];
    const known = new Set(pathsIn(prompt));
    const sane = variants.filter((text) =>
      pathsIn(text).every((p) => known.has(p) || fs.existsSync(path.join(templateRoot, p)) || fs.existsSync(path.join(setupRoot, p))),
    );
    if (sane.length < variants.length) console.error(`\n${id}: dropped ${String(variants.length - sane.length)} paraphrase(s) with invented paths`);
    sane.slice(0, n).forEach((text, i) => {
      const target = path.join(poolDir, `${id}-${suffix}${String(i + 1)}`);
      fs.cpSync(path.join(poolDir, id), target, { recursive: true });
      fs.writeFileSync(path.join(target, 'prompt.md'), `${text.trim()}\n`);
      const meta = JSON.parse(fs.readFileSync(path.join(target, 'task.json'), 'utf8')) as { id: string; tags?: string[]; title: string };
      meta.id = `${id}-${suffix}${String(i + 1)}`;
      meta.title = text.trim().slice(0, 70);
      meta.tags = [...(meta.tags ?? []), lang === 'ru' ? 'ru' : 'paraphrase'];
      fs.writeFileSync(path.join(target, 'task.json'), JSON.stringify(meta, null, 2) + '\n');
      written += 1;
    });
    process.stdout.write(`\r${id}: +${String(variants.length)}  (total ${String(written)})   `);
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`\nwrote ${String(written)} paraphrased tasks`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
