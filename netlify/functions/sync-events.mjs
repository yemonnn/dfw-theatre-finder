import { load } from "cheerio";

export default async () => {
  const url = "https://www.broadwayworld.com/dallas/regionalshows.cfm";

  const res = await fetch(url, {
    headers: { "User-Agent": "DFWTheatrePersonalUse/1.0" }
  });

  const html = await res.text();

  // Quick diagnostics: are listings present in the raw HTML?
  const checks = {
    status: res.status,
    length: html.length,
    has_showid: html.includes("showid"),
    has_regionalshows_link: html.includes("regionalshows.cfm?showid="),
    has_ld_json: html.includes('application/ld+json'),
    has_json_blob: html.includes("__NEXT_DATA__") || html.includes("window.__NUXT__") || html.includes("dataLayer")
  };

  // Pull any show links if they exist
  const showLinks = Array.from(
    html.matchAll(/regionalshows\.cfm\?showid=\d+/g)
  )
    .slice(0, 25)
    .map(m => m[0]);

  // Pull any suspicious API-like URLs in scripts
  const apiHints = Array.from(
    html.matchAll(/https?:\/\/[^"' ]+(api|json|feed|rss)[^"' ]+/gi)
  )
    .slice(0, 25)
    .map(m => m[0]);

  // Also try a basic cheerio scan for any anchors mentioning showid
  const $ = load(html);
  const cheerioLinks = $("a[href*='showid']")
    .slice(0, 25)
    .map((_, el) => $(el).attr("href"))
    .get();

  return new Response(
    JSON.stringify({ url, checks, showLinks, apiHints, cheerioLinks }, null, 2),
    { headers: { "Content-Type": "application/json" } }
  );
};
