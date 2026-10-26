import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

// Runs the real migration on an in-memory Postgres with a minimal stand-in
// for Supabase's auth schema and roles, then checks the access rules.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
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
  await db.exec(readFileSync("supabase/migrations/0001_init.sql", "utf8"));

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

  it("blocks anonymous table access", async () => {
    expect(await asUser(null, () => rows("select id from public.analyses"))).toHaveLength(0);
    expect(await asUser(null, () => rows("select token from public.client_links"))).toHaveLength(0);
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
