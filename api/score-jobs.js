import { scoreJobs, rankJobs } from "../lib/score.js";
import { makeAnthropicCaller } from "../lib/anthropic.js";

// Accepts { jobs: [...] } and returns them scored and ranked.
// Bulk pass uses Haiku. To promote the shortlist to Sonnet, score once with
// Haiku, take the top N, then re-score those with a Sonnet caller.
export default async function handler(req, res) {
  try {
    const jobs = (req.body && req.body.jobs) || [];
    if (!Array.isArray(jobs) || jobs.length === 0) {
      res.status(400).json({ error: "Provide a non empty jobs array" });
      return;
    }
    const callModel = makeAnthropicCaller("claude-haiku-4-5-20251001");
    const scored = await scoreJobs(jobs, callModel);
    const ranked = rankJobs(scored);
    res.status(200).json({ count: ranked.length, jobs: ranked });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
