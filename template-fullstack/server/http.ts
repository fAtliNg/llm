import type { Context } from 'hono';

/** Error bodies are always `{ message }`, plus `issues` for validation errors. */
export function notFound(c: Context, message = 'Not found') {
  return c.json({ message }, 404);
}

export function conflict(c: Context, message: string) {
  return c.json({ message }, 409);
}

/** Hook for `zValidator`: answers 400 with the given message and the zod issues. */
export function invalid(message: string) {
  return (result: { success: boolean; error?: { issues: readonly unknown[] } }, c: Context) => {
    if (!result.success) return c.json({ message, issues: result.error?.issues ?? [] }, 400);
    return undefined;
  };
}
