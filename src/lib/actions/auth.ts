"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { loginEmail, normalizeUsername, PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN, USERNAME_TAKEN } from "@/lib/auth/username";
import { requireMember } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type ActionResult } from "./result";

const Username = z.string().transform(normalizeUsername).pipe(z.string().regex(USERNAME_PATTERN, "Invalid username"));
const Password = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX);

/**
 * Creates an account without sending any email. The first account becomes the
 * admin; every later one waits until an admin turns it on in team settings.
 */
export async function signUpAction(input: { username: string; fullName: string; password: string }): Promise<ActionResult> {
  try {
    const { username, fullName, password } = z
      .object({ username: Username, fullName: z.string().trim().min(1).max(100), password: Password })
      .parse(input);
    const { error } = await createAdminClient().auth.admin.createUser({
      email: loginEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    });
    if (error) throw new Error(error.code === "email_exists" ? USERNAME_TAKEN : error.message);
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof z.ZodError ? e.issues[0].message : e);
  }
}

/**
 * Admin only: sets a member's password, and their username when they have
 * none yet (accounts made before usernames).
 */
export async function setMemberLogin(userId: string, input: { username?: string; password: string }): Promise<ActionResult> {
  try {
    const { profile: me } = await requireMember();
    if (me.role !== "admin") throw new Error("Admins only");
    const id = z.uuid().parse(userId);
    const password = Password.parse(input.password);
    const username = input.username ? Username.parse(input.username) : undefined;
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(
      id,
      username ? { password, email: loginEmail(username), email_confirm: true, user_metadata: { username } } : { password },
    );
    if (error) throw new Error(error.code === "email_exists" ? USERNAME_TAKEN : error.message);
    if (username) {
      const { error: profileError } = await admin.from("profiles").update({ username }).eq("id", id);
      if (profileError) throw new Error(profileError.message);
    }
    revalidatePath("/settings");
    return ok(undefined);
  } catch (e) {
    return fail(e instanceof z.ZodError ? e.issues[0].message : e);
  }
}
