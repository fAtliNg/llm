# Базовая модель

Обзор на 2026-09-14. Ограничение из `03-infrastructure.md`: модель должна влезать в Q4 на RTX 4070 Super (12 ГБ) и M2 Pro (16 ГБ) с контекстом 16–32k. Это класс 7–12B dense. MoE-модели вроде Qwen3.6-35B-A3B и Qwen3-Coder-Next (80B-A3B) в 12 ГБ не влезают, хотя именно их сейчас советуют для 16 ГБ и выше.

## Кандидаты

| | Qwen3.5-9B | Gemma 4 12B | Ministral 3 8B | Qwen2.5-Coder-7B |
|---|---|---|---|---|
| Дата | март 2026 | апрель 2026 | декабрь 2025 | ноябрь 2024 |
| Лицензия | Apache 2.0 | Apache 2.0 (по карточке на HF, проверить) | Apache 2.0 | Apache 2.0 |
| Специализация | общая, thinking-режим | общая, native function calling | общая | код, FIM |
| LiveCodeBench v6 | 65.6 | 72.0 | не опубликован | не сопоставим (старый) |
| BFCL-V4 (tool calling) | 66.1 | нет данных | нет данных | слабый |
| Контекст | 262k | 256k | 256k | 128k (32k нативно) |
| Архитектура | гибрид Gated DeltaNet + attention, крошечный KV-кэш | sliding window 1024 + global attention | обычная | обычная, GQA |
| Размер Q4 | ~6.6 ГБ | ~7.5 ГБ, есть QAT-кванты от Google | ~5.5 ГБ | ~4.7 ГБ |
| bf16 LoRA, VRAM | 22 ГБ, QLoRA не рекомендуется | ~30 ГБ (оценка), нужна карта 48 ГБ | ~20 ГБ | ~18 ГБ |
| Unsloth | отдельный гайд, нужен Transformers v5, медленная компиляция Triton-ядер | поддерживается | поддерживается | поддерживается |
| GGUF / MLX / Ollama | всё есть | всё есть | GGUF, Ollama | всё есть |
| Знание нашего стека | Tailwind 4, Zod 4, React 19, RR7, Vite 7. RR8 и Vite 8 не знает | примерно то же | конец 2025 | ничего: срез 2024 |

## Рекомендация

**Основной кандидат: Qwen3.5-9B.**

- Лучше всех подходит под 12 ГБ: гибридная архитектура даёт очень компактный KV-кэш, контекст 32k помещается с запасом.
- Дообучение на самой дешёвой карте: bf16 LoRA в 22 ГБ, то есть 4090 или A5000. Gemma 4 12B потребует 48 ГБ, вдвое дороже в час.
- Лучший из класса по tool calling (BFCL-V4 66.1), что важно для работы в агенте.
- Самые свежие знания стека среди кандидатов.
- Первоклассная поддержка везде: Unsloth, llama.cpp, Ollama, MLX, LM Studio.

**Претендент: Gemma 4 12B.** Заметно сильнее по коду (LiveCodeBench 72.0 против 65.6), native function calling. Цена: 12B медленнее в инференсе примерно на треть, в 12 ГБ влезает впритык с контекстом, дообучение на карте 48 ГБ. Стоит проверить в ручном прогоне, вдруг разница в качестве перевешивает.

**Отклонены.** Ministral 3 8B: бенчмарков по коду не опубликовано, по остальным метрикам уровень Qwen3-8B. Qwen2.5-Coder-7B: не знает ничего из нашего стека, эффект файнтюна будет максимальным, но стартовая точка слабая, и tool calling слабый. Можно вернуться к нему как ко «второму эксперименту», если захочется показать эффект на старой базе.

## Как закрыть выбор

Шаг 2 плана: ручной прогон 10 задач на стеке через Ollama на M2 Pro, обе модели в Q4, без thinking-режима, в одном и том же промпте с шаблоном проекта в контексте. Смотрим на компилируемость, актуальность API и скорость. Выбираем.

## Особенности Qwen3.5 для дообучения

- Thinking включён по умолчанию, выключается через `enable_thinking: false` в chat template.
- Unsloth: чтобы сохранить способность к рассуждению, в датасете должно быть не меньше 75% примеров с reasoning. Если учить только на прямых ответах, рассуждение деградирует. Это открытый вопрос: учить и запускать в non-thinking режиме ради скорости или генерировать короткие reasoning-трассы учителем.
- QLoRA не рекомендуется из-за высокой ошибки квантизации, только bf16 LoRA.
- Стартовые гиперпараметры из гайда Unsloth: r=16, alpha=16, dropout=0, batch 1, gradient accumulation 4, warmup 10.
- Экспорт в GGUF прямо из Unsloth: `save_pretrained_gguf` с `q4_k_m` и `q8_0`.
- Есть базовая версия Qwen3.5-9B-Base, но дообучаем Instruct.

## Источники

- [Qwen3.5-9B на Hugging Face](https://huggingface.co/Qwen/Qwen3.5-9B)
- [Gemma 4 12B-it на Hugging Face](https://huggingface.co/google/gemma-4-12B-it), [Gemma 4 Technical Report](https://arxiv.org/html/2607.02770v1)
- [Ministral-3-8B-Instruct-2512](https://huggingface.co/mistralai/Ministral-3-8B-Instruct-2512)
- [Unsloth: Qwen3.5 Fine-tuning Guide](https://unsloth.ai/docs/models/qwen3.5/fine-tune), [Unsloth: Gemma 4](https://unsloth.ai/docs/models/gemma-4)
- [Kilo: The Best Local Coding Models for Any Setup](https://blog.kilo.ai/p/the-best-local-coding-models-for), [InsiderLLM: Best Local Coding Models 2026](https://insiderllm.com/guides/best-local-coding-models-2026/)
