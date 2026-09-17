/**
 * Compile-time equality check. Used to pin a database row type to its contract type:
 *
 *   export type TaskRowMatchesContract = Assert<Equal<TaskRow, Task>>;
 *
 * If the table and the zod schema drift apart, `npm run typecheck` fails on that line.
 */
export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export type Assert<T extends true> = T;
