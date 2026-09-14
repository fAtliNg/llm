# Версии библиотек

Зафиксировано 2026-09-14 по `npm view <pkg> version`. Правило: берём последнюю стабильную версию, кроме случаев, где свежий мажор ломает инструменты или вышел меньше месяца назад. Отклонения от последней версии помечены и объяснены.

## Ядро

| Пакет | Версия | Последняя на npm | Примечание |
|-------|--------|------------------|------------|
| react, react-dom | 19.3.0 | 19.3.0 | Вышла 2026-09-09, минорная |
| typescript | **6.0.3** | 7.0.2 | TS 7 это нативный компилятор на Go без программного API, typescript-eslint его не поддерживает до 7.1 (peer: `<6.1.0`). Берём 6.0.3, последнюю JS-версию |
| @reduxjs/toolkit | 2.12.0 | 2.12.0 | |
| react-redux | 9.3.0 | 9.3.0 | |
| react-hook-form | 7.88.0 | 7.88.0 | |
| @hookform/resolvers | 5.9.1 | 5.9.1 | peer: zod `^3.25 \|\| ^4` |
| zod | 4.6.5 | 4.6.5 | Zod 4 с 2025-07-09 |
| react-router | 8.3.1 | 8.3.1 | v8 с 2026-06-17, «скучный» релиз: ESM-only, `react-router-dom` удалён, импорты из `react-router` и `react-router/dom`, минимум React 19.2.7 |

## Инфраструктура

| Пакет | Версия | Последняя на npm | Примечание |
|-------|--------|------------------|------------|
| vite | 8.3.0 | 8.3.0 | v8 с 2026-03-12, на rolldown |
| @vitejs/plugin-react | 6.1.1 | 6.1.1 | peer: vite `^8` |
| vitest | **4.1.11** | 5.0.0 | v5 вышла 2026-09-03, 11 дней назад: автоматический `clearAllMocks`, ошибка вместо предупреждения на не-верхнеуровневый `vi.mock`, смена coverage-провайдера. Плагины отстают. Для модели API тестов одинаковый, поэтому берём 4.1.x и переоцениваем через пару месяцев |
| @testing-library/react | 16.3.3 | 16.3.3 | peer: @testing-library/dom `^10` |
| @testing-library/user-event | 14.6.7 | 14.6.7 | |
| @testing-library/jest-dom | 7.0.1 | 7.0.1 | v7 с 2026-07-20 |
| jsdom | 30.0.1 | 30.0.1 | |
| msw | 2.15.0 | 2.15.0 | |
| eslint | 10.10.0 | 10.10.0 | v10 с 2026-02-06 |
| typescript-eslint | 8.70.0 | 8.70.0 | peer: eslint `^8.57 \|\| ^9 \|\| ^10`, typescript `>=4.8.4 <6.1.0` |
| prettier | 3.9.6 | 3.9.6 | |
| @types/react | 19.3.0 | 19.3.0 | |

## Библиотека компонентов: shadcn/ui + Tailwind

Выбрано 2026-09-14, обоснование в `04-decisions.md`.

| Пакет | Версия | Примечание |
|-------|--------|------------|
| shadcn (CLI) | 4.21.0 | Компоненты копируются в репозиторий как исходники |
| tailwindcss | 4.3.3 | v4 с 2025-01-21, конфиг через CSS и `@theme` |
| @tailwindcss/vite | 4.3.3 | peer: vite `^5.2 \|\| ^6 \|\| ^7 \|\| ^8` |
| radix-ui | 1.6.7 | Единый пакет вместо `@radix-ui/react-*`, shadcn перешёл на него в феврале 2026 |
| lucide-react | 1.46.0 | Иконки |
| class-variance-authority | 0.7.1 | |
| tailwind-merge | 3.7.0 | |

## Отклонённые кандидаты

Версии сохранены на случай пересмотра.

### MUI

| Пакет | Версия | Примечание |
|-------|--------|------------|
| @mui/material | 9.4.0 | v9 с 2026-04-07, восьмой версии Material UI не было. Удалены system props в пользу `sx`, Grid без `direction="column"`, тема генерирует `color-mix()` |
| @emotion/react | 11.14.0 | |
| @emotion/styled | 11.14.1 | |

### Ant Design

| Пакет | Версия | Примечание |
|-------|--------|------------|
| antd | 6.6.4 | v6 с 2025-11-21, гладкая миграция с v5, React 19 без патча, LESS удалён, CSS-переменные + CSS-in-JS |
| @ant-design/icons | 6.3.4 | Обновляется вместе с antd, v6 несовместим с antd 5 |

Особенность: у antd своя система форм (Form, Form.Item, rules, useForm). При выборе antd рекомендуется убрать react-hook-form и оставить zod только для схем API.

## Что вышло после среза знаний Claude

Для генерации датасета и для базовой модели это одинаково слепые зоны, документацию по ним нужно давать в контексте: TypeScript 6 и 7, React Router 8, Vite 8, Vitest 5, MUI 9, ESLint 10, jest-dom 7, React 19.3.

## Источники

- [React Router v8 (remix.run)](https://remix.run/blog/react-router-v8), [обзор InfoQ](https://www.infoq.com/news/2026/08/react-route-v8/)
- [Material UI v9 (mui.com)](https://mui.com/blog/introducing-material-ui-v9/), [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- [Vitest 5.0 is out](https://vitest.dev/blog/vitest-5.html)
- [TypeScript 7.0 (InfoQ)](https://www.infoq.com/news/2026/08/typescript-7-released/), [typescript-eslint и TS 7 (Mergify)](https://mergify.com/blog/native-typescript-compiler-faster-typecheck)
- [Ant Design: From v5 to v6](https://ant.design/docs/react/migration-v6/), [Ant Design 6.0 is Here](https://github.com/ant-design/ant-design/issues/55804)
- [shadcn/ui: unified radix-ui package](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui), [shadcn/ui: Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
