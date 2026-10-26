"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PROFILE_FIELDS } from "@/frameworks/profile";
import { getFramework } from "@/frameworks/registry";
import { requireMember } from "@/lib/dal";
import { toJson, type Analysis, type LinkScope } from "@/lib/types";
import { fail, ok, type ActionResult } from "./result";

const LinkInput = z.object({
  projectId: z.uuid(),
  label: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
  expiresInDays: z.number().int().min(1).max(365).nullable(),
  includeProfile: z.boolean(),
  /** analysis id → step ids the client may fill */
  analyses: z.record(z.uuid(), z.array(z.string()).min(1)),
});

export async function createLink(input: z.input<typeof LinkInput>): Promise<ActionResult<{ token: string }>> {
  try {
    const { supabase, user } = await requireMember();
    const body = LinkInput.parse(input);
    const ids = Object.keys(body.analyses);
    if (!body.includeProfile && ids.length === 0) throw new Error("Pick at least one section");

    const { data: rows } = ids.length
      ? await supabase.from("analyses").select("id, framework_key, status").eq("project_id", body.projectId).in("id", ids)
      : { data: [] };
    const scope: LinkScope = {
      profile: body.includeProfile ? PROFILE_FIELDS.map((f) => f.key) : [],
      analyses: {},
    };
    for (const a of (rows ?? []) as Pick<Analysis, "id" | "framework_key" | "status">[]) {
      const def = getFramework(a.framework_key);
      if (!def) continue;
      const steps = def.steps.filter((s) => body.analyses[a.id].includes(s.id));
      scope.analyses[a.id] = steps.flatMap((s) => s.fields.map((f) => f.key));
    }

    const token = randomBytes(24).toString("base64url");
    const { error } = await supabase.from("client_links").insert({
      project_id: body.projectId,
      token,
      label: body.label || null,
      message: body.message || null,
      scope: toJson(scope),
      expires_at: body.expiresInDays ? new Date(Date.now() + body.expiresInDays * 86_400_000).toISOString() : null,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);

    const waiting = ((rows ?? []) as Pick<Analysis, "id" | "status">[]).filter((a) => a.status !== "done").map((a) => a.id);
    if (waiting.length) await supabase.from("analyses").update({ status: "waiting_client" }).in("id", waiting);
    await supabase.from("projects").update({ status: "waiting_client" }).eq("id", body.projectId).in("status", ["draft", "analyzing"]);

    revalidatePath(`/projects/${body.projectId}`, "layout");
    return ok({ token });
  } catch (e) {
    return fail(e);
  }
}

export async function revokeLink(projectId: string, linkId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("client_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}/links`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}
