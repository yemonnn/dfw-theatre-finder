import cheerio from "cheerio";

export default async (request) => {

  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const res = await fetch("https://www.broadwayworld.com/dallas/regionalshows.cfm");
    const html = await res.text();

    const $ = cheerio.load(html);
    const events = [];

    $("a").each((_, el) => {
      const link = $(el);
      const title = link.text().trim();
      if (!title || title.length < 4) return;

      const context = link.closest("tr, li, div").text();
      const match = context.match(/\((\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})\)/);
      if (!match) return;

      const year = new Date().getFullYear();
      const start = new Date(year, match[1] - 1, match[2]);
      const end = new Date(year, match[3] - 1, match[4]);

      events.push({
        id: crypto.randomUUID(),
        title,
        venue: "",
        city: "DFW",
        startDate: start.toISOString().slice(0,10),
        endDate: end.toISOString().slice(0,10),
        times: [],
        url: new URL(link.attr("href"), "https://www.broadwayworld.com").toString(),
        source: "BroadwayWorld Dallas",
        category: "Mixed"
      });
    });

    return new Response(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        events
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};
