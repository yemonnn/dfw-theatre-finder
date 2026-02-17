import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("dfw-theatre");
  const data = await store.getJSON("events.json");

  return new Response(
    JSON.stringify(data || { generatedAt: null, count: 0, events: [] }),
    { headers: { "Content-Type": "application/json" } }
  );
};
