import { query } from "./_generated/server";

export const list = query(async ({ db, storage }) => {
  const runs = await db.query("runs").order("desc").take(20);

  // Add storage URLs to each run
  return Promise.all(
    runs.map(async (run) => ({
      ...run,
      imageUrl: await storage.getUrl(run.imageStorageId),
    }))
  );
});
