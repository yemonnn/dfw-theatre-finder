export default async () => {
  return new Response(
    JSON.stringify({ generatedAt: null, events: [] }),
    { headers: { "Content-Type": "application/json" } }
  );
};
