"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/dal";
import { fail, ok, type ActionResult } from "./result";

async function requireAdmin() {
  const ctx = await requireMember();
  if (ctx.profile.role !== "admin") throw new Error("Admins only");
  return ctx;
}

export async function updateMember(userId: string, patch: { role?: "admin" | "consultant"; active?: boolean }): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (userId === user.id) throw new Error("You can't change your own role or access");
    const { error } = await supabase
      .from("profiles")
      .update(z.object({ role: z.enum(["admin", "consultant"]).optional(), active: z.boolean().optional() }).parse(patch))
      .eq("id", z.uuid().parse(userId));
    if (error) throw new Error(error.message);
    revalidatePath("/settings");
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}
