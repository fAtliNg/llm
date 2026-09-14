# Канонические паттерны

Шаблон лежит в `template/`. Каждая связка стека реализована ровно одним способом, и фича `tasks` это эталон каждого слоя. Датасет генерируется от этих паттернов, бенчмарк проверяет их соблюдение. Файл `template/AGENTS.md` это та же информация в сжатом виде для модели.

## Слои и файлы

| Слой | Файл | Паттерн |
|---|---|---|
| Модель | `src/features/tasks/model.ts` | Константы-кортежи `as const`, из них `z.enum`, из схем типы через `z.infer`. Схема ввода `taskInputSchema` и схема сущности `taskSchema = taskInputSchema.extend({ id })`. Подписи для UI в `Record<Enum, string>` |
| API | `src/api/base-api.ts`, `src/features/tasks/api.ts` | Один `createApi` на приложение, `tagTypes` там же. Фичи делают `injectEndpoints`. Список тегируется `{ type, id: 'LIST' }` плюс каждый элемент по id. Мутации инвалидируют ровно то, что меняют. Экспорт хуков деструктуризацией |
| Стор | `src/app/store.ts`, `src/app/hooks.ts` | `makeStore()` для тестов и синглтон `store` для приложения. Типизированные хуки через `withTypes` |
| Роутер | `src/app/router.tsx` | React Router 8 в режиме библиотеки: `createBrowserRouter` с массивом `routes`, свойство `Component`, вложенные маршруты под layout с `Outlet`. Импорты из `react-router`, `RouterProvider` из `react-router/dom` |
| Страницы | `src/pages/*` | Страница владеет данными: вызывает хуки RTK Query, показывает `Skeleton` при загрузке, `Alert` при ошибке, передаёт данные в презентационные компоненты фичи |
| Формы | `src/features/tasks/task-form.tsx` | `useForm` с `zodResolver`, один `Controller` на поле, `Field` + `FieldLabel` + `FieldError`, `aria-invalid` и `data-invalid` на каждом поле, `noValidate` на форме. Radix `Select` подключается через `value` и `onValueChange` |
| Компоненты | `src/features/tasks/task-list.tsx`, `task-badges.tsx` | Презентационные, принимают данные пропсами. Варианты shadcn через `Record<Enum, Variant>` |
| Деструктивные действия | `src/features/tasks/delete-task-button.tsx` | `Dialog` с подтверждением, состояние `open` контролируемое, `isLoading` мутации блокирует кнопку |
| Моки | `src/mocks/*` | In-memory `db` с `reset()`, обработчики MSW 2 через `http.*` и `HttpResponse.json`, валидация тела через ту же zod-схему. Один набор обработчиков для dev (worker) и тестов (server) |
| Тесты | `src/test/*`, `*.test.tsx` рядом с кодом | `renderWithProviders` для компонентов, `renderApp` для страниц по реальным маршрутам. Запросы по роли и подписи. Сеть через MSW, переопределение ответа через `server.use`. Хуки не мокаются |

## Верификация

`npm run verify` = `tsc --noEmit` + `eslint .` + `prettier --check .` + `vitest run`. Это и фильтр датасета, и метрика бенчмарка.

Строгость: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`; typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`; testing-library и jest-dom для тестов.

## Белый список компонентов shadcn

Установлены: alert, badge, button, card, dialog, field, input, label, select, separator, skeleton, table, textarea. Остальное добавляется через `npx shadcn@4.21.0 add <name>` по мере необходимости бенчмарка, с последующим `npm run format`.

## Решения, принятые при сборке шаблона

- shadcn 4 удалил компонент `Form` в пользу `Field`, поэтому формы строятся на `Controller` + `Field`.
- shadcn 4 использует пакет `cn` вместо `clsx` + `tailwind-merge`. Оставлен `cn`, лишние пакеты убраны.
- `import.meta.env.VITE_API_URL`: относительный `/api` в браузере, абсолютный `http://localhost:3000/api` в тестах, потому что `fetch` в Node не умеет относительные URL, а MSW сопоставляет обработчики с origin jsdom.
- `globals: true` в Vitest нужен для автоочистки React Testing Library. Тесты всё равно импортируют `describe`, `it`, `expect` явно.
- Полифиллы для Radix в jsdom (`ResizeObserver`, `matchMedia`, `scrollIntoView`, pointer capture) в `src/test/polyfills.ts` через `vi.fn` и `vi.stubGlobal`.
- Сбой регистрации service worker MSW не роняет приложение: ловится, пишется предупреждение, запросы идут в сеть.
- ESLint: `no-invalid-void-type` выключен из-за идиомы `void` в RTK Query; для `src/components/ui/**` выключены правила, которые ломает сгенерированный код. jsx-a11y не подключён: не поддерживает ESLint 10.
- Установка через npm 11 (`npx npm@latest install`): npm 10 падает на разрешении peer-зависимостей этого набора.
