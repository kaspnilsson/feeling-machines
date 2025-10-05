import { mutation } from "@/convex/_generated/server";

/**
 * Migration: Convert imageStorageId to imageUrl
 * Run with: npx convex run migrate:migrateImageUrls
 */
export const migrateImageUrls = mutation(async ({ db, storage }) => {
  const runs = await db.query("runs").collect();

  console.log(`Migrating ${runs.length} runs...`);

  let migrated = 0;

  for (const run of runs) {
    // Check if run has old imageStorageId field
    if ((run as any).imageStorageId) {
      const storageId = (run as any).imageStorageId;
      const imageUrl = await storage.getUrl(storageId);

      await db.patch(run._id, {
        imageUrl,
        imageStorageId: undefined, // Remove old field
      } as any);

      migrated++;
      console.log(`Migrated run ${run._id}`);
    }
  }

  console.log(`Migration complete! Migrated ${migrated} runs.`);
  return { migrated, total: runs.length };
});
