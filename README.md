# Not a Consult

Web app for a consulting team to analyze client businesses with the frameworks from the *Business Frameworks Cheat Sheet*: start from a business question, get framework suggestions, fill them step by step with helpers, let the client fill parts through a link, then summarize and share a report.

## What's in Phase 1

- Team sign-in with Google or an emailed link, roles Admin / Consultant, allowed email domains
- Clients → projects → business questions → 1–3 frameworks per question
- Business profile filled once per project and reused by frameworks
- Question wizard: pick the category, get rule-based suggestions by stage and keywords, or ask AI; or choose any framework from the library
- All 35 frameworks in the library. 19 open as a canvas you edit in place: JTBD, Business Model Canvas, Unit Economics, Playing to Win, AARRR, OKRs, MECE / Issue Tree, Lean Canvas, Value Proposition Canvas, SWOT→TOWS, Blue Ocean ERRC, Ansoff, BCG, PESTEL, Five Forces, McKinsey 7S, 4P/7P, Balanced Scorecard and 7 Powers. The other 16 use a general form until Phase 2
- On the canvas: click a field to add, edit or remove items in place; numbers show the suggested order; drag items between fields; give related items the same link color; a side panel shows the selected field's hint, example, checks and AI draft. The step-by-step form is still one click away
- Helpers while filling: hints, examples, the cheat sheet's common trap, automatic checks, a filled example; with AI on, draft one field, every empty field or a whole step, and "review"
- Client links without login: choose which sections and steps the client fills, set an expiry, revoke anytime; the database only lets a link read and write its own fields
- Summary: executive summary (Pyramid Principle), decisions and hypotheses to test, action plan; drafted from the filled data or by AI, then edited
- Report: live preview, publish a read-only snapshot link, print / save as PDF
- Thai and English UI; report language per project; AI can be turned off per project
- Edit history for every framework field (who changed it, or which client link), kept by the database; the history view comes in Phase 3
- AI usage log: each AI request's model and tokens, with a 30-day summary and estimated cost in Team settings

## Try it without setup

```bash
npm install
npm run dev
```

Open http://localhost:3000/demo. The demo walks through the real screens (question → framework → client link → summary → report) with a fictional business and saves nothing. It only exists in development.

## Setup

1. **Supabase**: create a project, then run every file in `supabase/migrations/` in order (in the SQL editor, or with `supabase db push`). Tables are only reachable through the grants in these files, so don't skip any.
2. **Sign-in URLs**: in Supabase → Authentication → URL Configuration, set the Site URL to your app URL and add your app URLs to Redirect URLs (e.g. `http://localhost:3000/**`, your Vercel URL). Email links work from here with Supabase's built-in mailer, which sends only a few emails an hour; set up custom SMTP (Authentication → Emails) before inviting the team.
3. **Google sign-in** (optional): in Supabase → Authentication → Providers, enable Google with an OAuth client from Google Cloud Console, and add `https://<your-project>.supabase.co/auth/v1/callback` as the authorized redirect URI in Google.
4. **Environment**: copy `.env.example` to `.env.local` and fill in the values (Supabase → Project Settings → API keys).
5. Run:

   ```bash
   npm install
   npm run dev
   ```

6. The first person to sign in becomes the admin. Open **Team settings** and add your company email domain so teammates get access when they sign in.

## Deploying to Vercel

Import the GitHub repo in Vercel, add the same environment variables, deploy, then add the Vercel URL to Supabase's redirect URLs.

## Tests

```bash
npm test
```

Runs the framework rules and calculations, the AI output schemas, and the database access rules (the real migrations on an in-memory Postgres).

## Privacy

Project data is stored in Supabase. When AI is on for a project, the data in that project is sent to the Claude API to draft and summarize. Turn AI off for clients who don't want that, and avoid entering personal data about individuals that the analysis doesn't need.
