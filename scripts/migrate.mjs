// Runs on Vercel before `next build` (via the "vercel-build" script).
// Applies Drizzle migrations to the production database so the tables exist
// before the app serves its first request. Skipped automatically in local
// dev, where the embedded database migrates itself on boot.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error(
    [
      "",
      "──────────────────────────────────────────────────────────────",
      " DATABASE_URL is not set — cannot create the database tables.",
      "",
      " Fix it in Vercel:",
      "   1. Storage tab → create a Neon Postgres database, OR",
      "      Settings → Environment Variables → add DATABASE_URL.",
      "   2. Also set SESSION_SECRET (32+ chars) and APP_PASSWORD.",
      "   3. Redeploy.",
      "──────────────────────────────────────────────────────────────",
      "",
    ].join("\n")
  );
  process.exit(1);
}

console.log("[trading-journal] Applying database migrations…");
execSync("drizzle-kit migrate", { stdio: "inherit" });
console.log("[trading-journal] Migrations up to date.");
