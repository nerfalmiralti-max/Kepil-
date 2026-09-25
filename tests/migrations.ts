import { readdir, readFile } from "node:fs/promises";
import type { PGlite } from "@electric-sql/pglite";
export async function migrate(db: PGlite) {
  const files = (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files)
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
}
