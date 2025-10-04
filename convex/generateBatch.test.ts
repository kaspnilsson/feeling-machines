import { describe, it, expect } from "vitest";

describe("Run Group generation", () => {
  it("should generate valid UUID for runGroupId", () => {
    const runGroupId = crypto.randomUUID();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(runGroupId).toMatch(uuidRegex);
  });

  it("should generate unique IDs on each call", () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();

    expect(id1).not.toBe(id2);
  });
});

describe("Batch run creation logic", () => {
  it("should create correct number of placeholder runs for artists", () => {
    const artists = [
      { slug: "gpt-4o-mini", displayName: "GPT-4o Mini", provider: "openai" },
      { slug: "gpt-4o", displayName: "GPT-4o", provider: "openai" },
    ];

    const runGroupId = crypto.randomUUID();
    const promptVersion = "v2-neutral";
    const brushSlug = "gpt-image-1";

    const placeholderRuns = artists.map((artist) => ({
      runGroupId,
      artistSlug: artist.slug,
      brushSlug,
      promptVersion,
      status: "queued",
      createdAt: Date.now(),
    }));

    expect(placeholderRuns).toHaveLength(2);
    expect(placeholderRuns[0].runGroupId).toBe(runGroupId);
    expect(placeholderRuns[0].status).toBe("queued");
    expect(placeholderRuns[1].artistSlug).toBe("gpt-4o");
  });
});
