"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const runs = useQuery(api.runs.list);
  const generate = useAction(api.generate.generate);

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feeling Machines</h1>
          <p className="text-gray-600">
            AI Artists expressing their inner worlds
          </p>
        </header>

        <button
          onClick={() => generate()}
          className="mb-8 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Generate new artwork
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runs?.map((r) => (
            <div
              key={r._id}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={r.imageUrl}
                alt="AI artwork"
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">{r.artistStmt}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="font-medium">{r.artistSlug}</span>
                  <span className="mx-2">→</span>
                  <span>{r.brushSlug}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {runs?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No artworks yet. Click "Generate new artwork" to create one!
          </div>
        )}
      </div>
    </main>
  );
}
