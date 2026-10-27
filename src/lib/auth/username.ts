import { supabaseUrl } from "@/lib/supabase/env";

/** 3–30 characters: lowercase letters, digits, dot, dash or underscore, starting with a letter or digit. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;
/** Supabase hashes passwords with bcrypt, which reads at most 72 bytes. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Error code from sign-up when the username is already in use. */
export const USERNAME_TAKEN = "USERNAME_TAKEN";

export const normalizeUsername = (raw: string) => raw.trim().toLowerCase();

/**
 * Supabase Auth keys accounts by email, so each username maps to an address on
 * the project's own host. Nobody can receive mail there, and the app never sends any.
 */
export function loginEmail(username: string) {
  return `${normalizeUsername(username)}@${new URL(supabaseUrl()).hostname}`;
}

/** The name to show for a team member, and the handle under it. */
export const displayName = (p: { full_name: string | null; username: string | null; email: string }) =>
  p.full_name || p.username || p.email;
export const handle = (p: { username: string | null; email: string }) => (p.username ? `@${p.username}` : p.email);
