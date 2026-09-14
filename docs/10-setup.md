# Локальная установка

Что нужно на M2 Pro для прогона бенчмарка и ручной работы с моделью.

## Node и npm

```bash
nvm install 22.23.2 && nvm use 22.23.2
```

Устанавливать зависимости через npm 11: `npx npm@latest install`. npm 10 падает на этом наборе peer-зависимостей.

## Ollama и модель

Ollama уже установлен (`/usr/local/bin/ollama`, версия 0.32.9 на 2026-09-14). Модель:

```bash
ollama pull qwen3.5:9b
```

Тег `9b` это Q4_K_M, около 6,6 ГБ. Контекст задаётся явно, иначе Ollama тихо обрежет его до 4k и tool calling развалится:

```bash
cat > /tmp/Modelfile <<'MF'
FROM qwen3.5:9b
PARAMETER num_ctx 32768
MF
ollama create qwen3.5:9b-32k -f /tmp/Modelfile
```

KV-кэш в Q8 и прочие настройки сервера через переменные окружения при запуске `ollama serve`: `OLLAMA_KV_CACHE_TYPE=q8_0`, `OLLAMA_FLASH_ATTENTION=1`.

Проверить, что модель отвечает и поддерживает инструменты:

```bash
curl -s http://localhost:11434/api/chat -d '{"model":"qwen3.5:9b-32k","messages":[{"role":"user","content":"What is the weather in Paris?"}],"tools":[{"type":"function","function":{"name":"get_weather","parameters":{"type":"object","properties":{"city":{"type":"string"}}}}}],"stream":false,"think":false}' | head -c 600
```

В ответе должен быть `tool_calls` с `get_weather`.

## Pi

Pi установлен локальной зависимостью в `bench/`, глобально ставить не нужно. Конфигурация провайдера лежит в репозитории: `bench/pi-home/models.json`. Запуск через обёртку:

```bash
cd bench && npm run pi -- --list-models
```

Ручная сессия с моделью в шаблоне:

```bash
cd bench && npm run pi -- --model ollama/qwen3.5:9b-32k --thinking off -c ../template
```

## Что проверить при первом запуске

Это открытые вопросы, ответы записать в `04-decisions.md`:

1. Выдаёт ли Qwen3.5-9B через Ollama корректные tool calls в формате Pi: попросить прочитать файл и внести правку.
2. Выключается ли thinking флагом `--thinking off` через OpenAI-совместимый API Ollama. Если в ответах появляется `<think>`, нужен другой способ: параметр `think: false` в Modelfile или в настройках провайдера Pi.
3. Скорость: токенов в секунду на prefill и генерации при контексте 8k и 32k.
4. Память: не уезжает ли модель на CPU при 32k контекста (в `ollama ps` колонка PROCESSOR должна показывать 100% GPU).

## Дымовой прогон бенчмарка

```bash
cd bench && npx npm@latest install
npm run bench -- validate all      # эталонные решения проходят
npm run bench -- null all          # пустой прогон проваливается
npm run bench -- run --config base-harness --tasks T00 --reps 1
npm run bench -- report
```
