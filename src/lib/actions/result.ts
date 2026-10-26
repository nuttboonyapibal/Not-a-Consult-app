/** Error for a delete that matched nothing: RLS hides rows the user may not delete. */
export const NOT_ALLOWED = "NOT_ALLOWED";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: unknown): ActionResult<never> => ({
  ok: false,
  error: error instanceof Error ? error.message : typeof error === "string" ? error : "Unexpected error",
});
