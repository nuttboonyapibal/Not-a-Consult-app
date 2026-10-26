// Sets the username and password of an existing account: the admin made before
// usernames existed, or an admin who forgot their password (nobody else can
// reset it from the app). Run in your own terminal so the password stays local:
//
//   npm run set-login
//
// Reads .env.local; needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

// Same rules and mapping as src/lib/auth/username.ts.
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const loginEmail = (username) => `${username}@${new URL(url).hostname}`;

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
if (!stdin.isTTY) {
  console.error("Run this in an interactive terminal.");
  process.exit(1);
}

// Prompts go through readline; while `muted`, its echo is dropped and each
// typed character shows as "*" instead.
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) stdout.write(chunk, encoding);
    callback();
  },
});
output.columns = stdout.columns;

async function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: stdin, output, terminal: true });
  rl.on("SIGINT", () => {
    stdout.write("\n");
    process.exit(130);
  });
  let stars = 0;
  const onKey = (text, key) => {
    if (key?.name === "backspace") {
      if (stars > 0) stdout.write("\b \b");
      stars = Math.max(0, stars - 1);
    } else if (text && text >= " ") {
      stdout.write("*".repeat([...text].length));
      stars += [...text].length;
    }
  };
  try {
    if (!hidden) return await rl.question(question);
    stdout.write(question);
    muted = true;
    stdin.on("keypress", onKey);
    return await rl.question("");
  } finally {
    stdin.off("keypress", onKey);
    if (hidden) {
      muted = false;
      stdout.write("\n");
    }
    rl.close();
  }
}

try {
  const [{ data: list, error: listError }, { data: profiles, error: profileError }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("profiles").select("id, username, full_name, role, active"),
  ]);
  if (listError) throw listError;
  if (profileError) throw profileError;
  const people = list.users.map((u) => ({ user: u, profile: profiles.find((p) => p.id === u.id) }));

  console.log("\nAccounts:");
  people.forEach(({ user, profile }, i) => {
    const name = profile?.full_name ?? "-";
    const login = profile?.username ? `@${profile.username}` : `${user.email} (no username)`;
    console.log(`  ${i + 1}) ${name}  ${login}  ${profile?.role ?? "?"}${profile?.active ? "" : ", waiting for approval"}`);
  });

  const pick = Number(await ask("\nAccount number: "));
  const chosen = people[pick - 1];
  if (!chosen) throw new Error("No such account.");

  const current = chosen.profile?.username ?? "";
  const typed = (await ask(`Username${current ? ` [${current}]` : ""}: `)).trim().toLowerCase() || current;
  if (!USERNAME.test(typed)) throw new Error("Username must be 3–30 characters: a–z, 0–9, dot, dash or underscore.");

  const password = await ask("New password (8–72 characters, shown as *): ", { hidden: true });
  if (password.length < 8 || password.length > 72) throw new Error("Password must be 8–72 characters.");
  if ((await ask("Type it again: ", { hidden: true })) !== password) throw new Error("The passwords don't match.");

  const { error } = await admin.auth.admin.updateUserById(chosen.user.id, {
    email: loginEmail(typed),
    email_confirm: true,
    password,
    user_metadata: { ...chosen.user.user_metadata, username: typed },
  });
  if (error) throw error;
  const { error: updateError } = await admin.from("profiles").update({ username: typed }).eq("id", chosen.user.id);
  if (updateError) throw updateError;

  console.log(`\nDone. Sign in with username "${typed}" and the new password.`);
} catch (e) {
  console.error(`\n${e.message ?? e}`);
  process.exitCode = 1;
}
