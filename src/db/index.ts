import * as schema from "./schema";
import type { PgliteDatabase } from "drizzle-orm/pglite";

export type Db = PgliteDatabase<typeof schema>;

let dbPromise: Promise<Db> | null = null;

async function initDb(): Promise<Db> {
  let db: Db;
  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const sql = neon(process.env.DATABASE_URL);
    // Neon and PGlite drizzle instances share the same query API.
    db = drizzle(sql, { schema }) as unknown as Db;
  } else {
    // Local development: embedded Postgres, zero setup. Data lives in .data/pglite.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const { promises: fs } = await import("fs");
    const dataDir = ".data/pglite";
    await fs.mkdir(dataDir, { recursive: true });
    const client = new PGlite(dataDir);
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
  }
  // Default setups are seeded per account at signup, not globally.
  return db;
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = initDb().catch((e) => {
      dbPromise = null; // let the next request retry a failed init
      throw e;
    });
  }
  return dbPromise;
}
