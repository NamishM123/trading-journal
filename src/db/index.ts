import * as schema from "./schema";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { DEFAULT_SETUPS } from "@/lib/constants";

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
  await seedIfEmpty(db);
  return db;
}

async function seedIfEmpty(db: Db) {
  try {
    const existing = await db.select({ id: schema.setups.id }).from(schema.setups).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.setups).values(
        DEFAULT_SETUPS.map((s, i) => ({
          name: s.name,
          description: s.description,
          sortOrder: i,
        }))
      );
    }
  } catch {
    // Table missing (migrations not applied yet in production) — surfaces on first query.
  }
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
