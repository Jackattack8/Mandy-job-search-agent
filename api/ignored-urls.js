import { supabaseHeaders } from "../lib/supabase.js";

// Returns the urls already marked ignored so the dashboard can hide them on
// load. Returns an empty list when Supabase is not configured.
export default async function handler(req, res) {
  try {
    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!base || !key) {
      res.status(200).json({ urls: [] });
      return;
    }

    const result = await fetch(
      base + "/rest/v1/job_postings?ignored=eq.true&select=url",
      { headers: supabaseHeaders(key) }
    );
    if (!result.ok) {
      res.status(200).json({ urls: [] });
      return;
    }
    const rows = await result.json();
    res.status(200).json({ urls: rows.map((r) => r.url) });
  } catch (err) {
    res.status(200).json({ urls: [] });
  }
}
