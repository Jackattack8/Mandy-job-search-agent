import { supabaseHeaders } from "../lib/supabase.js";

// Marks a single job ignored or not, keyed by its url. Upserts so it works
// whether or not the job is already stored. If Supabase is not configured it
// returns ok without persisting, so the dashboard toggle still works in session.
export default async function handler(req, res) {
  try {
    const body = req.body || {};
    const url = body.url;
    const ignored = body.ignored !== false;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }

    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!base || !key) {
      res.status(200).json({ ok: true, persisted: false });
      return;
    }

    const upsert = await fetch(base + "/rest/v1/job_postings?on_conflict=url", {
      method: "POST",
      headers: supabaseHeaders(key, {
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify([{ url, ignored, seen_at: new Date().toISOString() }]),
    });

    if (!upsert.ok) {
      const detail = await upsert.text();
      res.status(500).json({ error: "Supabase update failed: " + detail });
      return;
    }
    res.status(200).json({ ok: true, persisted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
