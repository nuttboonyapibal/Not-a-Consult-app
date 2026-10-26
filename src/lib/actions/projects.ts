"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/dal";
import { toJson } from "@/lib/types";
import { fail, NOT_ALLOWED, ok, type ActionResult } from "./result";

const ClientInput = z.object({
  name: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(200).optional(),
});

export async function createClientAction(formData: FormData) {
  const { supabase, user } = await requireMember();
  const input = ClientInput.parse({
    name: formData.get("name"),
    industry: formData.get("industry") || undefined,
  });
  const { error } = await supabase.from("clients").insert({ ...input, created_by: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

const ProjectInput = z.object({
  clientId: z.uuid(),
  name: z.string().trim().min(1).max(200),
  stage: z.enum(["startup", "sme", "enterprise"]),
  aiEnabled: z.boolean(),
  reportLang: z.enum(["th", "en"]),
});

export async function createProjectAction(formData: FormData) {
  const { supabase, user } = await requireMember();
  const input = ProjectInput.parse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    stage: formData.get("stage"),
    aiEnabled: formData.get("aiEnabled") === "on",
    reportLang: formData.get("reportLang"),
  });
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.clientId,
      name: input.name,
      stage: input.stage,
      ai_enabled: input.aiEnabled,
      report_lang: input.reportLang,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/projects/${data.id}`);
}

const SettingsInput = z.object({
  name: z.string().trim().min(1).max(200),
  stage: z.enum(["startup", "sme", "enterprise"]),
  status: z.enum(["draft", "waiting_client", "analyzing", "summarized"]),
  aiEnabled: z.boolean(),
  reportLang: z.enum(["th", "en"]),
});

export async function updateProjectSettings(projectId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const input = SettingsInput.parse({
      name: formData.get("name"),
      stage: formData.get("stage"),
      status: formData.get("status"),
      aiEnabled: formData.get("aiEnabled") === "on",
      reportLang: formData.get("reportLang"),
    });
    const { error } = await supabase
      .from("projects")
      .update({
        name: input.name,
        stage: input.stage,
        status: input.status,
        ai_enabled: input.aiEnabled,
        report_lang: input.reportLang,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`, "layout");
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

/** Deletes the project and everything in it, then returns to its client. */
export async function deleteProject(projectId: string): Promise<ActionResult> {
  let clientId: string;
  try {
    const { supabase } = await requireMember();
    const { data, error } = await supabase.from("projects").delete().eq("id", z.uuid().parse(projectId)).select("client_id");
    if (error) throw new Error(error.message);
    if (!data.length) throw new Error(NOT_ALLOWED);
    clientId = data[0].client_id;
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}

/** Deletes the client and every project under it (see 0005_safe_client_delete.sql for who may). */
export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { data, error } = await supabase.from("clients").delete().eq("id", z.uuid().parse(clientId)).select("id");
    if (error) throw new Error(error.message);
    if (!data.length) throw new Error(NOT_ALLOWED);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/");
  redirect("/");
}

export async function patchProfile(projectId: string, patch: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.rpc("patch_business_profile", { pid: projectId, patch: toJson(patch) });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function addMember(projectId: string, userId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("project_members").insert({ project_id: projectId, user_id: z.uuid().parse(userId) });
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}/settings`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function removeMember(projectId: string, userId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}/settings`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}
