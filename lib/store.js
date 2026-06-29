import { supabaseHeaders } from "./supabase.js";

// Persists ranked jobs. If Supabase env vars are set it upserts via the REST
// API (no extra dependencies). Otherwise it logs, so the pipeline still runs
// before you wire up storage. Upsert on the job url keeps the table free of
// repeats across daily runs and preserves any "applied" status you set.

export async function storeJobs(rankedJobs) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log("No Supabase config. Ranked job count:", rankedJobs.length);
    return { stored: 0, skipped: rankedJobs.length };
  }

  const rows = rankedJobs.map((j) => ({
    url: j.url,
    title: j.title,
    company: j.company,
    location: j.location,
    posted_at: j.posted_at,
    sources: j.sources,
    fit_score: j.score ? j.score.fit_score : null,
    recommend: j.score ? j.score.recommend : null,
    honesty_flags: j.score ? j.score.honesty_flags : [],
    reasons: j.score ? j.score.reasons : null,
    seen_at: new Date().toISOString(),
  }));

  const res = await fetch(url + "/rest/v1/job_postings?on_conflict=url", {
    method: "POST",
    headers: supabaseHeaders(key, {
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error("Supabase upsert failed: " + res.status + " " + detail);
  }
  return { stored: rows.length, skipped: 0 };
}
