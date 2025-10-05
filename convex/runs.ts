import { query, mutation } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";

export const list = query(async ({ db }) => {
  const runs = await db.query("runs").order("desc").take(20);
  return runs;
});

export const getImageUrl = query(
  async ({ storage }, { storageId }: { storageId: Id<"_storage"> }) => {
    return await storage.getUrl(storageId);
  }
);

export const getStorageUrl = mutation(
  async ({ storage }, { storageId }: { storageId: Id<"_storage"> }) => {
    return await storage.getUrl(storageId);
  }
);
