import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

export const getImageUrl = query(
  async ({ storage }, { storageId }: { storageId: Id<"_storage"> }) => {
    return await storage.getUrl(storageId);
  }
);
