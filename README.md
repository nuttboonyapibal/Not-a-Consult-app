# Not a Consult

Web app for a consulting team to analyze client businesses with the frameworks from the *Business Frameworks Cheat Sheet*: start from a business question, get framework suggestions, fill them step by step with helpers, let the client fill parts through a link, then summarize and share a report.

## What's in Phase 1

- Google sign-in for the team, roles Admin / Consultant, allowed email domains
- Clients → projects → business questions → 1–3 frameworks per question
- Business profile filled once per project and reused by frameworks
- Question wizard: pick the category, get rule-based suggestions by stage and keywords, or ask AI; or choose any framework from the library
- All 35 frameworks in the library. 7 have full structured forms, checks and visuals (JTBD, Business Model Canvas, Unit Economics, Playing to Win, AARRR, OKRs, MECE / Issue Tree); the other 28 use a general form until Phase 2
- Helpers while filling: hints, examples, the cheat sheet's common trap, automatic checks, a filled example; with AI on, "draft this step" and "review"
- Client links without login: choose which sections and steps the client fills, set an expiry, revoke anytime; the database only lets a link read and write its own fields
- Summary: executive summary (Pyramid Principle), decisions and hypotheses to test, action plan; drafted from the filled data or by AI, then edited
- Report: live preview, publish a read-only snapshot link, print / save as PDF
- Thai and English UI; report language per project; AI can be turned off per project

## Try it without setup

```bash
npm install
npm run dev
```

Open http://localhost:3000/demo. The demo walks through the real screens (question → framework → client link → summary → report) with a fictional business and saves nothing. It only exists in development.

## Setup

1. **Supabase**: create a project, then run `supabase/migrations/0001_init.sql` in the SQL editor.
2. **Google sign-in**: in Supabase → Authentication → Providers, enable Google with an OAuth client from Google Cloud Console. Add `https://<your-project>.supabase.co/auth/v1/callback` as the authorized redirect URI in Google, and add your app URLs (e.g. `http://localhost:3000/**`, your Vercel URL) to Supabase → Authentication → URL Configuration → Redirect URLs.
3. **Environment**: copy `.env.example` to `.env.local` and fill in the values.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. The first person to sign in becomes the admin. Open **Team settings** and add your company email domain so teammates get access when they sign in.

## Deploying to Vercel

Import the GitHub repo in Vercel, add the same environment variables, deploy, then add the Vercel URL to Supabase's redirect URLs.

## Tests

```bash
npm test
```

Runs the framework rules and calculations, the AI output schemas, and the database access rules (the real migration on an in-memory Postgres).

## Privacy

Project data is stored in Supabase. When AI is on for a project, the data in that project is sent to the Claude API to draft and summarize. Turn AI off for clients who don't want that, and avoid entering personal data about individuals that the analysis doesn't need.
