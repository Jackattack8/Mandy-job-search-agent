import { fetchAllJobs } from "./fetch-jobs.js";
import { scoreJobs, rankJobs } from "../lib/score.js";
import { makeAnthropicCaller } from "../lib/anthropic.js";
import { storeJobs } from "../lib/store.js";

// Triggered by Vercel Cron once a day (see vercel.json). Fetches every source,
// scores with Haiku, ranks, and persists the result.
export default async function handler(req, res) {
  try {
    const jobs = await fetchAllJobs();
    const callModel = makeAnthropicCaller("claude-haiku-4-5-20251001");
    const scored = await scoreJobs(jobs, callModel);
    const ranked = rankJobs(scored);
    const result = await storeJobs(ranked);
    res.status(200).json({ fetched: jobs.length, scored: ranked.length, ...result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
