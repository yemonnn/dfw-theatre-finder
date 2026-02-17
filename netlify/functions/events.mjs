import { load } from "cheerio";

function toISODateMaybe(value) {
  if (!value) return null;
  // BroadwayWorld JSON-LD usually gives ISO already. This just normalizes.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function extractEventsFromJsonLd(json) {
  const nodes = [];

  // JSON-LD can be:
  // - a single object
  // - an array
  // - an object with @graph
  if (Array.isArray(json)) nodes.push(...json);
  else if (json && typeof json === "object" && Array.isArray(json["@graph"])) nodes.push(...json["@graph"]);
  else if (json && typeof json === "object") nodes.push(json);

  const events = [];
  for (const node of nodes) {
    const type = node?.["@type"];
    const typeList = asArray(type).map(String);

    const looksLikeEvent =
      typeList.some((t) => /Event/i.test(t)) ||
      node?.startDate ||
      node?.endDate;

    if (!looksLikeEvent) continue;

    const name = node?.name?.toString?.() || null;
    const startDate = toISODateMaybe(node?.startDate);
    const endDate = toISODateMaybe(node?.endDate) || startDate;

    const location = node?.location || {};
    const venue = location?.name?.toString?.() || null;

    const addr = location?.address || {};
    const city =
      addr?.addressLocality?.toString?.() ||
      addr?.addressRegion?.toString?.() ||
      null;

    const url = node?.url?.toString?.() || null;

    const image = Array.isArray(node?.image)
      ? node.image[0]
      : node?.image?.toString?.() || null;

    // Only keep entries that at least have a name + startDate
    if (!name || !startDate) continue;

    events.push({
      title: name,
      venue,
      city,
      startDate,
      endDate,
      url,
      image,
      source: "BroadwayWorld Dallas",
      category: "Regional / Local",
    });
  }

  return events;
}

export default async () => {
  const sourceUrl = "https://www.broadwayworld.com/dallas/regionalshows.cfm";

  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "DFWTheatrePersonalUse/1.0" },
  });

  const html = await res.text();
  const $ = load(html);

  const events = [];
  const seen = new Set();

  // Pull JSON-LD scripts and parse them
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).text();
    if (!text) return;

    try {
      const json = JSON.parse(text);
      const extracted = extractEventsFromJsonLd(json);

      for (const ev of extracted) {
        const key = `${ev.title}__${ev.startDate}__${ev.venue || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        events.push(ev);
      }
    } catch {
      // ignore JSON parse errors for non-standard blocks
    }
  });

  // Keep only DFW-ish results (you can add/remove cities anytime)
const DFW_CITIES = new Set([
  "Dallas", "Fort Worth", "Arlington", "Plano", "Irving", "Garland", "Frisco",
  "McKinney", "Denton", "Richardson", "Lewisville", "Grapevine", "Allen",
  "Carrollton", "Flower Mound", "Mesquite", "Euless", "Bedford", "Hurst",
  "Southlake", "Coppell", "The Colony", "Rowlett", "Rockwall", "Cleburne"
]);

const filtered = events.filter(ev => {
  if (!ev.city) return true; // keep unknown city for now (better than losing data)
  return DFW_CITIES.has(ev.city);
});

// replace events array contents with filtered
events.length = 0;
events.push(...filtered);

  
  // Sort by soonest first
  events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return new Response(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: events.length,
        events,
      },
      null,
      2
    ),
    { headers: { "Content-Type": "application/json" } }
  );
};
