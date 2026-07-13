# Trading Journal

A personal orderflow trade-recap journal built around one idea — **the Label Rule**:

> Before clicking buy or sell, pretend someone is sitting next to you asking you to
> justify the trade. If you can't name the exact setup from your playbook, you
> shouldn't be taking the trade.

Every recap starts with the label. If you couldn't name it, you log that honestly and
it counts against your discipline stats. Right after the label comes the second
question: **did you trade at a taper, or were you a monkey trading in balance?**

The rest follows Mark Douglas's *Trading in the Zone*: emotions before/during/after,
whether you fully accepted the risk before entry, whether you followed your rules, and
an execution grade that scores the **process, not the outcome** — a perfectly executed
loser is an A; a winning monkey trade is not.

## Features

- **Recap flow** — label first, taper/monkey second, then details, mind, evidence, narrative
- **Playbook** — your named setups (seeded with Re-bid/Re-offer, Trapped Buyers/Sellers, Absorption, Large Buyer/Seller Defending Price, Impulse High/Low of Trapped Distribution), each with rules, live edge stats, and a Douglas 20-trade sample tracker
- **Evidence** — drag-and-drop multiple screenshots per trade, each tagged (Delta, Footprint, DOM, Volume Profile, Market Structure), plus an embedded YouTube recap video
- **Dashboard** — equity curve, daily PnL calendar, win rate, avg R, execution grade, monkey rate, rule-following streak, rotating *Trading in the Zone* truths
- **Stats** — expectancy by setup, taper-vs-monkey comparison (the "monkey tax"), process-vs-outcome by grade, emotion-at-entry breakdown, violation log
- **Daily journal** — pre-market plan, market context, mindset check-in, post-market review

## Run it locally (zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — password is `trade`. With no env vars set, everything is
stored locally: an embedded Postgres (PGlite) in `.data/pglite` and screenshots in
`.data/uploads`. Delete `.data/` to start fresh.

## Deploy to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. In the Vercel project: **Storage → Create Database → Neon (Postgres)**. This sets
   `DATABASE_URL` automatically. **(Required — without it the app crashes on login,
   because Vercel's filesystem is read-only and the local embedded database can't run
   there.)**
3. **Storage → Create Blob store**. This sets `BLOB_READ_WRITE_TOKEN` automatically.
4. Add two more environment variables under **Settings → Environment Variables**:
   - `APP_PASSWORD` — the password you'll log in with
   - `SESSION_SECRET` — a long random string, **32+ characters**
     (e.g. `openssl rand -base64 32`, or any password-manager-generated string)
5. Deploy. **The database tables are created automatically on every deploy** — the
   `vercel-build` script runs the migrations before building, so there's no manual
   step. The playbook then seeds its default setups on first load.

If a deploy fails with "DATABASE_URL is not set", finish step 2 and redeploy.

Note: screenshots on Vercel Blob are served from public but unguessable URLs; the app
itself is password-gated.

## Moving this folder to its own repo

This app is fully self-contained. To give it its own GitHub repository:

```bash
# from inside trading-journal/
git init
git add -A
git commit -m "Trading journal"
git remote add origin git@github.com:<you>/trading-journal.git
git push -u origin main
```

(Or copy the folder anywhere and run the same commands — nothing outside this
directory is needed.)

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Neon Postgres
(PGlite locally) · Vercel Blob (filesystem locally) · iron-session
