"use client";

import { useState } from "react";

export default function AiChatBox() {
  const [query, setQuery] =
    useState("");

  const [response, setResponse] =
    useState("");

  async function askCopilot() {
    if (!query) return;

    setResponse(
      `AI Copilot analyzing: "${query}"`
    );
  }

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6">
      <h2 className="text-2xl font-semibold mb-4">
        AI Operations Copilot
      </h2>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Ask treasury or payout questions..."
          className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none"
        />

        <button
          onClick={askCopilot}
          className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-semibold"
        >
          Ask AI
        </button>
      </div>

      {response && (
        <div className="mt-5 bg-black border border-gray-800 rounded-2xl p-4">
          {response}
        </div>
      )}
    </div>
  );
}