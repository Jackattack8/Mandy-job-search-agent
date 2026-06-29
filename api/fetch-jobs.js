import {
  normalizeJSearch,
  normalizeAdzuna,
  normalizeWorkday,
  dedupe,
} from "../lib/normalize.js";

// Edit this list to the employers you want to watch directly on Workday.
// Find base + tenant + site by opening a company career page and watching the
// network tab for a request to /wday/cxs/<tenant>/<site>/jobs
const WORKDAY_WATCHLIST = [
  // {
  //   company: "Example Co",
  //   base: "https://example.wd5.myworkdayjobs.com",
  //   endpoint: "https://example.wd5.myworkdayjobs.com/wday/cxs/example/External/jobs",
  // },
];

const QUERIES = [
  "accounts receivable",
  "cash posting",
  "revenue cycle",
  "medical billing",
  "payment posting",
  "data entry",
];

const LOCATION = "Arkansas";

async function fetchJSearch(query) {
  const url =
    "https://jsearch.p.rapidapi.com/search?query=" +
    encodeURIComponent(query + " " + LOCATION) +
    "&page=1&num_pages=1";
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": process.env.JSEARCH_RAPIDAPI_KEY,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
  });
  if (!res.ok) return [];
  return normalizeJSearch(await res.json());
}

async function fetchAdzuna(query) {
  const url =
    "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=" +
    process.env.ADZUNA_APP_ID +
    "&app_key=" +
    process.env.ADZUNA_APP_KEY +
    "&results_per_page=25&what=" +
    encodeURIComponent(query) +
    "&where=" +
    encodeURIComponent(LOCATION);
  const res = await fetch(url);
  if (!res.ok) return [];
  return normalizeAdzuna(await res.json());
}

async function fetchWorkday(entry, query) {
  const res = await fetch(entry.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: query }),
  });
  if (!res.ok) return [];
  return normalizeWorkday(await res.json(), entry.company, entry.base);
}

export async function fetchAllJobs() {
  const tasks = [];
  for (const q of QUERIES) {
    tasks.push(fetchJSearch(q));
    tasks.push(fetchAdzuna(q));
    for (const entry of WORKDAY_WATCHLIST) tasks.push(fetchWorkday(entry, q));
  }
  const settled = await Promise.allSettled(tasks);
  const all = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return dedupe(all);
}

export default async function handler(req, res) {
  try {
    const jobs = await fetchAllJobs();
    res.status(200).json({ count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
