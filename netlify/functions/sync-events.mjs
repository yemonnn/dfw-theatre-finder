import { load } from "cheerio";
import { getStore } from "@netlify/blobs";

function toISODateMaybe(value) {
  if (!value) return null;
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
  if (Array.isArray(json)) nodes.push(...json);
  else if (json && typeof json === "object" && Array.isArray(json["@graph"])) nodes.push(...json["@graph"]);
  else if (json && typeof json === "object") nodes.push(json);

  const events = [];
  for (const node of nodes) {
    const typeList = asArray(node?.["@type"]).map(String);
    const looksLikeEvent =
      typeList.some((t) => /Event/i.test(t)) || node?.startDate || node?.endDate;
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
    const image = Array.isArray(node?.image) ? node.image[0] : node?.image?.toString?.() || null;

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

export default async (request) => {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sourceUrl = "https://www.broadwayworld.com/dallas/regionalshows.cfm";
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "DFWTheatrePersonalUse/1.0" },
  });
  const html = await res.text();
  const $ = load(html);

  const events = [];
  const seen = new Set();

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
    } catch {}
  });

  // DFW filter (same list you already used)
  const DFW_CITIES = new Set([
    "Dallas","Fort Worth","Arlington","Plano","Irving","Garland","Frisco",
    "McKinney","Denton","Richardson","Lewisville","Grapevine","Allen",
    "Carrollton","Flower Mound","Mesquite","Euless","Bedford","Hurst",
    "Southlake","Coppell","The Colony","Rowlett","Rockwall","Cleburne"
  ]);

  const filtered = events.filter(ev => !ev.city || DFW_CITIES.has(ev.city));
  filtered.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

  const payload = {
    generatedAt: new Date().toISOString(),
    count: filtered.length,
    events: filtered
  };

  const store = getStore("dfw-theatre");
  await store.set("events.json", JSON.stringify(payload));


  return new Response(JSON.stringify({ ok: true, count: filtered.length }), {
    headers: { "Content-Type": "application/json" }
  });
};
