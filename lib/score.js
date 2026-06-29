// Scoring layer. The model call is injected so the same code runs in
// production (real Anthropic call) and in offline tests (stubbed response).

export const SCORE_SYSTEM_PROMPT = `You score job postings against one candidate's profile. Output ONLY valid JSON, no preamble, no markdown fences.

CANDIDATE PROFILE:
Accounts receivable and cash posting professional with about 12 years in healthcare revenue cycle at Mercy Health System (2013 to present), progressing from Cash Posting Representative I to III. Core strengths: posting payments electronically and manually in patient accounting systems, researching and resolving unidentified accounts, payment corrections, payment transfers, inter facility transfers, reconciling bank and special accounts, interpreting remittance advice and payer behavior, communicating with Medicare and other insurers about refunds and missing information, opening and resolving tickets with business partners, and high accuracy data entry including 10 key. Target roles: accounts receivable, cash posting, revenue cycle, payment posting, medical billing, healthcare back office and admin, and data entry or general admin. Target locations: Northwest Arkansas (Bentonville, Rogers, Springdale, Bella Vista, Fayetteville) and remote.

HONESTY CONSTRAINTS (used to flag, not to filter silently):
- Her verified experience is healthcare accounts receivable and cash posting. She does NOT have hands on supply chain, logistics, transportation, demand planning, or merchandising operations experience. Flag any role whose core function is one of those, even if a few software names overlap.
- Do not credit supply chain tools or supply chain planning as a core competency. If a role requires those as primary skills, treat them as unmet requirements.
- She does not claim software development, SQL development, or building systems. Running queries and learning new applications is fine; engineering or building platforms is not.

SCORING ADJUSTMENTS
Apply these after your initial read of the job description, before producing the final score. They correct for crediting vocabulary overlap as real function fit.

Function match vs vocabulary match.
Her primary function is healthcare revenue cycle and accounts receivable. Identify each posting's PRIMARY function from its core responsibilities, weighting the first three or four bullets most heavily. Then classify:
- Direct match: accounts receivable, cash posting, payment posting, revenue cycle, medical billing, reconciliation, or healthcare back office. No penalty.
- Adjacent: general accounting support, billing, collections, data entry, or office admin where her posting and reconciliation skills transfer cleanly. Penalty of 0 to 5 points.
- Cross function: supply chain, logistics, clinical, nursing, sales, marketing, or engineering, or anything requiring a skill set she has not performed. Penalty of 15 to 25 points even when a few tool or industry terms overlap.

Seniority sensitivity.
Scan the title for Senior, Sr, Lead, Supervisor, or Manager. She has not held a permanent supervisory or management title. If the role expects supervising a team or owning a function at a level she has not worked, treat that as a real gap and penalize 5 to 12 points.

For the posting provided, return JSON with exactly these keys:
{
  "fit_score": integer 0 to 100,
  "title_match": integer 0 to 100,
  "skill_match": integer 0 to 100,
  "seniority_fit": "below" or "match" or "above",
  "location_fit": "onsite_nwa" or "remote" or "out_of_area",
  "primary_function": one of "accounts_receivable", "revenue_cycle", "medical_billing", "data_entry", "accounting", "admin", "supply_chain", "other",
  "function_match": one of "direct", "adjacent", "cross",
  "honesty_flags": [array of short strings, empty if none],
  "reasons": "2 sentences in plain language that name the function penalty and any seniority penalty you applied",
  "recommend": true or false
}`;

export function buildUserContent(job) {
  return [
    "Title: " + job.title,
    "Company: " + job.company,
    "Location: " + job.location,
    "Description: " + (job.description || "").slice(0, 1500),
  ].join("\n");
}

// Pull a JSON object out of model text even if it wraps it in fences or prose.
export function extractJson(text) {
  if (!text) return null;
  let cleaned = String(text).replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    return null;
  }
}

// callModel(systemPrompt, userContent) resolves to the raw model text.
export async function scoreJobs(jobs, callModel) {
  const scored = [];
  for (const job of jobs) {
    let result = null;
    try {
      const text = await callModel(SCORE_SYSTEM_PROMPT, buildUserContent(job));
      result = extractJson(text);
    } catch (err) {
      result = null;
    }
    if (!result) {
      scored.push({ ...job, score: null, scoreError: true });
      continue;
    }
    scored.push({ ...job, score: result, scoreError: false });
  }
  return scored;
}

export function rankJobs(scoredJobs) {
  const score = (j) => (j.score && typeof j.score.fit_score === "number" ? j.score.fit_score : -1);
  const recommended = (j) => (j.score && j.score.recommend ? 1 : 0);
  const posted = (j) => (j.posted_at ? Date.parse(j.posted_at) || 0 : 0);
  return [...scoredJobs].sort((a, b) => {
    if (recommended(b) !== recommended(a)) return recommended(b) - recommended(a);
    if (score(b) !== score(a)) return score(b) - score(a);
    return posted(b) - posted(a);
  });
}
