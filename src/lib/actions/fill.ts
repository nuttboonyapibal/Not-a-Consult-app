"use server";

import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "./result";

// Called from the client fill page without signing in. The database functions
// check the token, its expiry and which fields it may write.

const Token = z.string().min(32).max(128);
const MAX_PATCH_BYTES = 100_000;

export async function saveFill(token: string, analysisId: string | null, patch: Record<string, unknown>): Promise<ActionResult> {
  try {
    if (JSON.stringify(patch).length > MAX_PATCH_BYTES) throw new Error("Too much data at once");
    const { error } = await createAnonClient().rpc("client_link_save", {
      link_token: Token.parse(token),
      analysis_id: analysisId === null ? null : z.uuid().parse(analysisId),
      patch,
    });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function submitFill(token: string): Promise<ActionResult> {
  try {
    const { error } = await createAnonClient().rpc("client_link_submit", { link_token: Token.parse(token) });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}
