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
ollama create qwen3.5:9b-32k -f bench/ollama/Modelfile
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

## Результаты первого запуска (2026-09-14, M2 Pro 16 ГБ)

1. Tool calls в формате Pi корректные: `read`, `edit` с `oldText`/`newText`, `bash`. Правки применяются.
2. Thinking выключается: Ollama принимает `reasoning_effort: "none"`, Pi маппит `--thinking off` на него через `thinkingLevelMap` в `bench/pi-home/models.json`. Reasoning-токенов в ответах ноль.
3. Скорость: генерация 21,5 токенов/с, prefill 180 токенов/с на коротком контексте.
4. Память: модель целиком на GPU при контексте 32768 (`ollama ps` показывает 100% GPU, 6,5 ГБ).
5. T00 (переименовать кнопку) решён с обвязкой за 12 минут и 92 хода: 81 вызов bash, 5 read, 2 edit, 16 ошибок инструментов, контекст дорос до 24k. Модель предпочитает `cat`, `grep` и `sed` через bash вместо `read` и `edit`, придумывает пути, пишет во временные файлы, но в итоге делает правильную правку и сама запускает `npm run verify`.

## Дымовой прогон бенчмарка

```bash
cd bench && npx npm@latest install
npm run bench -- validate all      # эталонные решения проходят
npm run bench -- null all          # пустой прогон проваливается
npm run bench -- run --config base-harness --tasks T00 --reps 1
npm run bench -- report
```
