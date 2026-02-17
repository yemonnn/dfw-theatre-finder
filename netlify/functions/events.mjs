import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("dfw-theatre");

  const raw = await store.get("events.json"); // raw string (or null)

  const data = raw
    ? JSON.parse(raw)
    : { generatedAt: null, count: 0, events: [] };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
