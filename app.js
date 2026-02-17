const els = {
  lastRefresh: document.getElementById("lastRefresh"),
  status: document.getElementById("status"),
  count: document.getElementById("count"),
  list: document.getElementById("list"),
  toast: document.getElementById("toast"),

  q: document.getElementById("q"),
  start: document.getElementById("start"),
  end: document.getElementById("end"),
  source: document.getElementById("source"),
  category: document.getElementById("category"),
  city: document.getElementById("city"),
  sort: document.getElementById("sort"),

  apply: document.getElementById("apply"),
  reset: document.getElementById("reset"),
  refresh: document.getElementById("refresh"),
};

let allEvents = [];

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.style.display = "block";
  setTimeout(() => (els.toast.style.display = "none"), 2400);
}

function isoToPretty(iso) {
  if (!iso) return "TBA";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function overlapInRange(eventStart, eventEnd, rangeStart, rangeEnd) {
  if (!eventStart) return true;

  const s = new Date(eventStart + "T00:00:00").getTime();
  const e = new Date((eventEnd || eventStart) + "T23:59:59").getTime();

  const rs = rangeStart ? new Date(rangeStart + "T00:00:00").getTime() : null;
  const re = rangeEnd ? new Date(rangeEnd + "T23:59:59").getTime() : null;

  if (rs && e < rs) return false;
  if (re && s > re) return false;
  return true;
}

function buildSelectOptions(selectEl, values, keepPlaceholder = true) {
  const placeholder = keepPlaceholder ? selectEl.querySelector("option") : null;
  selectEl.innerHTML = "";
  if (placeholder) selectEl.appendChild(placeholder);

  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str){ return escapeHtml(str).replaceAll("`", "&#096;"); }

function render(events) {
  els.count.textContent = String(events.length);

  if (!events.length) {
    els.list.innerHTML = `<div class="empty">No shows match those filters.</div>`;
    return;
  }

  els.list.innerHTML = events.map(e => {
    const dateText = e.startDate && e.endDate && e.endDate !== e.startDate
      ? `${isoToPretty(e.startDate)} – ${isoToPretty(e.endDate)}`
      : isoToPretty(e.startDate);

    const where = [e.venue, e.city].filter(Boolean).join(" • ");
    const times = (e.times && e.times.length) ? ` • ${e.times.join(", ")}` : "";

    const chips = [
      e.source ? `<span class="chip"><strong>Source</strong> ${escapeHtml(e.source)}</span>` : "",
      e.category ? `<span class="chip"><strong>Type</strong> ${escapeHtml(e.category)}</span>` : "",
      e.city ? `<span class="chip"><strong>City</strong> ${escapeHtml(e.city)}</span>` : "",
    ].filter(Boolean).join("");

    const link = e.url
      ? `<a class="link" href="${escapeAttr(e.url)}" target="_blank" rel="noreferrer">Open listing ↗</a>`
      : "";

    return `
      <article class="card">
        <div class="cardTop">
          <div>
            <h3>${escapeHtml(e.title)}</h3>
            <div class="sub">${escapeHtml(dateText)}${where ? ` • ${escapeHtml(where)}` : ""}${times}</div>
          </div>
          <div class="chips">${chips}</div>
        </div>
        ${link}
      </article>
    `;
  }).join("");
}

function applyFilters() {
  const q = els.q.value.trim().toLowerCase();
  const rangeStart = els.start.value || null;
  const rangeEnd = els.end.value || null;
  const source = els.source.value || "";
  const category = els.category.value || "";
  const city = els.city.value || "";
  const sort = els.sort.value;

  let filtered = allEvents.filter(e => {
    if (source && e.source !== source) return false;
    if (category && e.category !== category) return false;
    if (city && e.city !== city) return false;

    if (!overlapInRange(e.startDate, e.endDate, rangeStart, rangeEnd)) return false;

    if (q) {
      const hay = `${e.title||""} ${e.venue||""} ${e.city||""} ${e.source||""} ${e.category||""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sort === "soonest") {
    filtered.sort((a,b) => (a.startDate||"9999-99-99").localeCompare(b.startDate||"9999-99-99"));
  } else if (sort === "latest") {
    filtered.sort((a,b) => (b.startDate||"").localeCompare(a.startDate||""));
  } else if (sort === "title") {
    filtered.sort((a,b) => (a.title||"").localeCompare(b.title||""));
  }

  render(filtered);
}

async function loadEvents() {
  els.status.textContent = "Loading…";
  try {
    const res = await fetch("/api/events", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
    const data = await res.json();

    els.lastRefresh.textContent = data.generatedAt
      ? new Date(data.generatedAt).toLocaleString()
      : "Not yet";

    allEvents = Array.isArray(data.events) ? data.events : [];

    const sources = [...new Set(allEvents.map(e => e.source).filter(Boolean))].sort();
    const cats = [...new Set(allEvents.map(e => e.category).filter(Boolean))].sort();
    const cities = [...new Set(allEvents.map(e => e.city).filter(Boolean))].sort();

    buildSelectOptions(els.source, sources);
    buildSelectOptions(els.category, cats);
    buildSelectOptions(els.city, cities);

    els.status.textContent = `Loaded ${allEvents.length} listings`;
    applyFilters();
  } catch (err) {
    console.error(err);
    els.status.textContent = "No data yet (backend not added)";
    els.list.innerHTML = `<div class="empty">Frontend is working. Next we’ll add Netlify Functions so events load here.</div>`;
    allEvents = [];
    render([]);
  }
}

async function triggerRefresh() {
  els.status.textContent = "Refreshing…";
  const res = await fetch("/api/sync-events", { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || "Refresh failed");
  toast(`Refreshed: ${data.count} events`);
  await loadEvents();
}

els.apply.addEventListener("click", applyFilters);
els.reset.addEventListener("click", () => {
  els.q.value = "";
  els.start.value = "";
  els.end.value = "";
  els.source.value = "";
  els.category.value = "";
  els.city.value = "";
  els.sort.value = "soonest";
  applyFilters();
});
els.refresh.addEventListener("click", async () => {
  try { await triggerRefresh(); }
  catch (e) { toast(String(e)); els.status.textContent = "Refresh error"; }
});

els.q.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilters(); });

loadEvents();
