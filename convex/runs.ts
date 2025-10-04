import { query } from "./_generated/server";

export const list = query(async ({ db }) => {
  return await db.query("runs").order("desc").take(20);
});
