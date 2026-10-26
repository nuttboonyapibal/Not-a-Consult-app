import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

// Runs the real migration on an in-memory Postgres with a minimal stand-in
// for Supabase's auth schema and roles, then checks the access rules.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BOB = "00000000-0000-0000-0000-0000000000b0";
const OUTSIDER = "00000000-0000-0000-0000-0000000000c0";

let db: PGlite;

async function asUser<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(uid ? "set role authenticated" : "set role anon");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

async function signUp(id: string, email: string) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
}

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows;
}

let projectId: string;
let analysisId: string;
let otherAnalysisId: string;
const TOKEN = "t".repeat(40);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }

  await signUp(ADMIN, "boss@team.co");
  await db.query("update public.app_settings set allowed_domains = '{team.co}'");
  await signUp(ALICE, "alice@team.co");
  await signUp(BOB, "bob@team.co");
  await signUp(OUTSIDER, "someone@gmail.com");

  await asUser(ALICE, async () => {
    const [client] = await rows<{ id: string }>(
      "insert into public.clients (name, created_by) values ('Acme', $1) returning id",
      [ALICE],
    );
    const [project] = await rows<{ id: string }>(
      "insert into public.projects (client_id, name, created_by) values ($1, 'Growth', $2) returning id",
      [client.id, ALICE],
    );
    projectId = project.id;
    const [q] = await rows<{ id: string }>(
      "insert into public.questions (project_id, text) values ($1, 'Why no repeat buys?') returning id",
      [projectId],
    );
    const [a] = await rows<{ id: string }>(
      "insert into public.analyses (project_id, question_id, framework_key, data) values ($1, $2, 'jtbd', '{\"situation\": \"old\", \"secret\": \"internal\"}') returning id",
      [projectId, q.id],
    );
    analysisId = a.id;
    const [b] = await rows<{ id: string }>(
      "insert into public.analyses (project_id, question_id, framework_key) values ($1, $2, 'okrs') returning id",
      [projectId, q.id],
    );
    otherAnalysisId = b.id;
    await db.query(
      `insert into public.client_links (project_id, token, scope, created_by)
       values ($1, $2, $3, $4)`,
      [projectId, TOKEN, JSON.stringify({ profile: ["businessName"], analyses: { [analysisId]: ["situation", "motivation"] } }), ALICE],
    );
  });
});

describe("profiles", () => {
  it("makes the first user an active admin", async () => {
    const [p] = await rows<{ role: string; active: boolean }>("select role, active from public.profiles where id = $1", [ADMIN]);
    expect(p).toEqual({ role: "admin", active: true });
  });

  it("activates allowed domains only", async () => {
    const list = await rows<{ id: string; active: boolean }>("select id, active from public.profiles order by id");
    const byId = Object.fromEntries(list.map((r) => [r.id, r.active]));
    expect(byId[ALICE]).toBe(true);
    expect(byId[OUTSIDER]).toBe(false);
  });

  it("stops consultants from promoting themselves", async () => {
    await expect(
      asUser(ALICE, () => db.query("update public.profiles set role = 'admin' where id = $1", [ALICE])),
    ).rejects.toThrow(/only admins/);
  });
});

describe("project access", () => {
  it("lets the creator and admins see the project", async () => {
    expect(await asUser(ALICE, () => rows("select id from public.projects"))).toHaveLength(1);
    expect(await asUser(ADMIN, () => rows("select id from public.projects"))).toHaveLength(1);
  });

  it("hides the project from other consultants until added", async () => {
    expect(await asUser(BOB, () => rows("select id from public.projects"))).toHaveLength(0);
    expect(await asUser(BOB, () => rows("select id from public.analyses"))).toHaveLength(0);
    expect(await asUser(BOB, () => rows("select id from public.clients"))).toHaveLength(0);

    await asUser(ALICE, () => db.query("insert into public.project_members (project_id, user_id) values ($1, $2)", [projectId, BOB]));
    expect(await asUser(BOB, () => rows("select id from public.analyses"))).toHaveLength(2);
    await asUser(ALICE, () => db.query("delete from public.project_members where project_id = $1 and user_id = $2", [projectId, BOB]));
  });

  it("gives inactive users nothing", async () => {
    expect(await asUser(OUTSIDER, () => rows("select id from public.projects"))).toHaveLength(0);
    await expect(
      asUser(OUTSIDER, () => db.query("insert into public.clients (name, created_by) values ('x', $1)", [OUTSIDER])),
    ).rejects.toThrow(/row-level security/);
  });

  it("gives anonymous callers no table access at all", async () => {
    await expect(asUser(null, () => rows("select id from public.analyses"))).rejects.toThrow(/permission denied/);
    await expect(asUser(null, () => rows("select token from public.client_links"))).rejects.toThrow(/permission denied/);
  });

  it("keeps the RLS helpers out of reach of anonymous callers", async () => {
    await expect(asUser(null, () => rows("select private.is_admin()"))).rejects.toThrow(/permission denied/);
  });

  it("only lets members change their own name, not their email", async () => {
    await asUser(ALICE, () => db.query("update public.profiles set full_name = 'Alice' where id = $1", [ALICE]));
    await expect(
      asUser(ALICE, () => db.query("update public.profiles set email = 'x@y.z' where id = $1", [ALICE])),
    ).rejects.toThrow(/permission denied/);
  });

  it("merges patches key by key", async () => {
    await asUser(ALICE, () => db.query("select public.patch_analysis($1, $2)", [analysisId, JSON.stringify({ outcome: "save time" })]));
    const [a] = await rows<{ data: Record<string, string>; status: string }>("select data, status from public.analyses where id = $1", [analysisId]);
    expect(a.data).toMatchObject({ situation: "old", outcome: "save time" });
    expect(a.status).toBe("in_progress");
  });

  it("refuses patches from people outside the project", async () => {
    await expect(
      asUser(BOB, () => db.query("select public.patch_analysis($1, $2)", [analysisId, JSON.stringify({ x: 1 })])),
    ).rejects.toThrow(/not found/);
  });
});

describe("client links", () => {
  it("returns only scoped fields", async () => {
    const [{ r }] = await asUser(null, () =>
      rows<{ r: { analyses: { id: string; data: Record<string, unknown> }[]; client_name: string } }>(
        "select public.client_link_get($1) r",
        [TOKEN],
      ),
    );
    expect(r.client_name).toBe("Acme");
    expect(r.analyses).toHaveLength(1);
    expect(r.analyses[0].id).toBe(analysisId);
    expect(r.analyses[0].data).toEqual({ situation: "old" });
  });

  it("saves scoped keys and drops the rest", async () => {
    await asUser(null, () =>
      db.query("select public.client_link_save($1, $2, $3)", [
        TOKEN,
        analysisId,
        JSON.stringify({ situation: "new", secret: "hacked" }),
      ]),
    );
    const [a] = await rows<{ data: Record<string, string> }>("select data from public.analyses where id = $1", [analysisId]);
    expect(a.data.situation).toBe("new");
    expect(a.data.secret).toBe("internal");
  });

  it("refuses analyses outside the scope", async () => {
    await expect(
      asUser(null, () => db.query("select public.client_link_save($1, $2, $3)", [TOKEN, otherAnalysisId, JSON.stringify({ objective: "x" })])),
    ).rejects.toThrow(/not in link scope/);
  });

  it("saves scoped profile fields", async () => {
    await asUser(null, () =>
      db.query("select public.client_link_save($1, null, $2)", [TOKEN, JSON.stringify({ businessName: "Acme Co", revenue: 1 })]),
    );
    const [p] = await rows<{ business_profile: Record<string, unknown> }>("select business_profile from public.projects where id = $1", [projectId]);
    expect(p.business_profile).toEqual({ businessName: "Acme Co" });
  });

  it("rejects wrong, revoked and expired tokens", async () => {
    const [{ r }] = await asUser(null, () => rows<{ r: unknown }>("select public.client_link_get($1) r", ["x".repeat(40)]));
    expect(r).toBeNull();

    await db.query("update public.client_links set expires_at = now() - interval '1 day' where token = $1", [TOKEN]);
    await expect(
      asUser(null, () => db.query("select public.client_link_save($1, $2, $3)", [TOKEN, analysisId, JSON.stringify({ situation: "late" })])),
    ).rejects.toThrow(/invalid or expired/);

    await db.query("update public.client_links set expires_at = null, revoked_at = now() where token = $1", [TOKEN]);
    const [{ r: revoked }] = await asUser(null, () => rows<{ r: unknown }>("select public.client_link_get($1) r", [TOKEN]));
    expect(revoked).toBeNull();
    await db.query("update public.client_links set revoked_at = null where token = $1", [TOKEN]);
  });

  it("marks the project as analyzing on submit", async () => {
    await db.query("update public.projects set status = 'waiting_client' where id = $1", [projectId]);
    await asUser(null, () => db.query("select public.client_link_submit($1)", [TOKEN]));
    const [p] = await rows<{ status: string }>("select status from public.projects where id = $1", [projectId]);
    expect(p.status).toBe("analyzing");
  });

  it("does not let anonymous users call the internal resolver", async () => {
    await expect(asUser(null, () => db.query("select public.resolve_client_link($1)", [TOKEN]))).rejects.toThrow(/permission denied/);
  });

  it("keeps the token functions on the anonymous key only", async () => {
    await expect(asUser(ALICE, () => db.query("select public.client_link_get($1)", [TOKEN]))).rejects.toThrow(/permission denied/);
  });
});

describe("published reports", () => {
  it("serves live reports and hides revoked ones", async () => {
    const reportToken = "r".repeat(40);
    await asUser(ALICE, () =>
      db.query("insert into public.report_publications (project_id, token, snapshot) values ($1, $2, '{\"title\": \"x\"}')", [projectId, reportToken]),
    );
    const [{ r }] = await asUser(null, () => rows<{ r: { snapshot: { title: string } } }>("select public.public_report_get($1) r", [reportToken]));
    expect(r.snapshot.title).toBe("x");

    await db.query("update public.report_publications set revoked_at = now()");
    const [{ r: gone }] = await asUser(null, () => rows<{ r: unknown }>("select public.public_report_get($1) r", [reportToken]));
    expect(gone).toBeNull();
  });
});

describe("timestamps", () => {
  it("keeps updated_at current", async () => {
    await db.query("update public.clients set updated_at = now() - interval '1 day'");
    await asUser(ALICE, () => db.query("update public.clients set industry = 'Food'"));
    const [c] = await rows<{ fresh: boolean }>("select updated_at > now() - interval '1 minute' as fresh from public.clients");
    expect(c.fresh).toBe(true);
  });

  it("moves a project up when work happens inside it", async () => {
    await db.query("update public.projects set updated_at = now() - interval '1 day' where id = $1", [projectId]);
    await asUser(ALICE, () => db.query("insert into public.questions (project_id, text) values ($1, 'Another question')", [projectId]));
    const [p] = await rows<{ fresh: boolean }>("select updated_at > now() - interval '1 minute' as fresh from public.projects where id = $1", [
      projectId,
    ]);
    expect(p.fresh).toBe(true);
  });
});

describe("edit history", () => {
  type Rev = { field_key: string; value_before: unknown; value_after: unknown; changed_by: string | null; client_link_id: string | null };
  const revisions = (field: string) =>
    rows<Rev>("select field_key, value_before, value_after, changed_by, client_link_id from public.analysis_revisions where analysis_id = $1 and field_key = $2 order by id", [
      otherAnalysisId,
      field,
    ]);

  it("records each changed field with who changed it", async () => {
    await asUser(ALICE, () => db.query("select public.patch_analysis($1, $2)", [otherAnalysisId, JSON.stringify({ objective: "Grow" })]));
    const [r] = await revisions("objective");
    expect(r).toMatchObject({ value_before: null, value_after: "Grow", changed_by: ALICE, client_link_id: null });
  });

  it("folds quick autosaves of one field into one row", async () => {
    await asUser(ALICE, () => db.query("select public.patch_analysis($1, $2)", [otherAnalysisId, JSON.stringify({ objective: "Grow fast" })]));
    await asUser(ALICE, () => db.query("select public.patch_analysis($1, $2)", [otherAnalysisId, JSON.stringify({ objective: "Grow faster" })]));
    const list = await revisions("objective");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ value_before: null, value_after: "Grow faster" });
  });

  it("starts a new row after a pause", async () => {
    await db.query("update public.analysis_revisions set updated_at = now() - interval '5 minutes'");
    await asUser(ALICE, () => db.query("select public.patch_analysis($1, $2)", [otherAnalysisId, JSON.stringify({ objective: "Grow steadily" })]));
    const list = await revisions("objective");
    expect(list).toHaveLength(2);
    expect(list[1]).toMatchObject({ value_before: "Grow faster", value_after: "Grow steadily" });
  });

  it("names the client link for client edits", async () => {
    const [{ id: linkId }] = await rows<{ id: string }>("select id from public.client_links where token = $1", [TOKEN]);
    await asUser(null, () => db.query("select public.client_link_save($1, $2, $3)", [TOKEN, analysisId, JSON.stringify({ motivation: "Eat well" })]));
    const [r] = await rows<Rev>("select * from public.analysis_revisions where analysis_id = $1 and field_key = 'motivation'", [analysisId]);
    expect(r).toMatchObject({ changed_by: null, client_link_id: linkId, value_after: "Eat well" });
  });

  it("lets project members read history, and nobody write it", async () => {
    expect(await asUser(BOB, () => rows("select id from public.analysis_revisions"))).toHaveLength(0);
    expect((await asUser(ALICE, () => rows("select id from public.analysis_revisions"))).length).toBeGreaterThan(0);
    await expect(
      asUser(ALICE, () => db.query("insert into public.analysis_revisions (analysis_id, project_id, field_key) values ($1, $2, 'x')", [analysisId, projectId])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("AI usage log", () => {
  const log = (projectArg: string | null) =>
    db.query("insert into public.ai_requests (project_id, kind, model, input_tokens, output_tokens) values ($1, 'assist', 'claude-sonnet-5-5', 100, 50)", [
      projectArg,
    ]);

  it("lets members log requests for their projects only", async () => {
    await asUser(ALICE, () => log(projectId));
    await expect(asUser(BOB, () => log(projectId))).rejects.toThrow(/row-level security/);
    await asUser(BOB, () => log(null));
  });

  it("shows people their own requests and admins everything", async () => {
    expect(await asUser(ALICE, () => rows("select user_id from public.ai_requests"))).toEqual([{ user_id: ALICE }]);
    expect(await asUser(ADMIN, () => rows("select id from public.ai_requests"))).toHaveLength(2);
  });

  it("totals usage per person under the same rules", async () => {
    const since = "2000-01-01";
    const summary = (uid: string) => asUser(uid, () => rows("select * from public.ai_usage_summary($1) order by user_id", [since]));
    expect(await summary(ALICE)).toEqual([
      { user_id: ALICE, model: "claude-sonnet-5-5", requests: 1, failed: 0, input_tokens: 100, output_tokens: 50, cache_read_tokens: 0 },
    ]);
    expect((await summary(ADMIN)).map((r) => r.user_id)).toEqual([ALICE, BOB]);
    await expect(asUser(null, () => db.query("select public.ai_usage_summary($1)", [since]))).rejects.toThrow(/permission denied/);
  });
});

describe("usernames", () => {
  const signUpAs = (id: string, email: string, meta: Record<string, string>) =>
    db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, email, JSON.stringify(meta)]);

  it("stores the username from sign-up, lowercased, and starts inactive", async () => {
    const id = "00000000-0000-0000-0000-0000000000d1";
    await signUpAs(id, "dana@project.supabase.co", { username: "Dana.K", full_name: "Dana" });
    const [p] = await rows<{ username: string; full_name: string; active: boolean }>("select username, full_name, active from public.profiles where id = $1", [id]);
    expect(p).toEqual({ username: "dana.k", full_name: "Dana", active: false });
  });

  it("rejects badly formed and duplicate usernames", async () => {
    await expect(signUpAs("00000000-0000-0000-0000-0000000000d2", "x@project.supabase.co", { username: "a b" })).rejects.toThrow(/profiles_username_format/);
    await expect(signUpAs("00000000-0000-0000-0000-0000000000d3", "y@project.supabase.co", { username: "dana.k" })).rejects.toThrow(/profiles_username_key/);
  });

  it("doesn't let members change usernames through the API", async () => {
    await expect(asUser(ALICE, () => db.query("update public.profiles set username = 'alice2' where id = $1", [ALICE]))).rejects.toThrow(/permission denied/);
  });
});
