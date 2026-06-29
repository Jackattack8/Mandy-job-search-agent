import {
  normalizeJSearch,
  normalizeAdzuna,
  normalizeWorkday,
  dedupe,
} from "../lib/normalize.js";
import { scoreJobs, rankJobs, extractJson } from "../lib/score.js";
import { jsearchResponse, adzunaResponse, workdayResponse } from "./fixtures.js";

// Stubbed model: returns Claude-shaped JSON text from simple heuristics so the
// real extractJson / scoreJobs / rankJobs code runs exactly as in production.
async function mockCallModel(_systemPrompt, userContent) {
  const text = userContent.toLowerCase();
  const has = (re) => re.test(text);

  const titleHit = has(/replenishment|inventory|supply chain|analyst|demand|logistics/);
  const skillHits = ["power bi", "sql", "excel", "retail link", "walmart", "tms", "wms"].filter(
    (k) => text.includes(k)
  ).length;

  let seniority = "match";
  if (has(/\bvp\b|vice president|director|executive leadership/)) seniority = "above";
  else if (has(/\bintern\b|entry level/)) seniority = "below";

  let location = "out_of_area";
  if (has(/remote/)) location = "remote";
  else if (has(/bentonville|rogers|springdale|bella vista|lowell|fayetteville|, ar\b|arkansas/))
    location = "onsite_nwa";

  const honesty_flags = [];
  if (has(/build (statistical|forecast).*model|forecast models from scratch|machine learning forecast/))
    honesty_flags.push("Requires building statistical forecast models from scratch");
  if (has(/tableau/)) honesty_flags.push("Requires Tableau");
  if (has(/\bvba\b/)) honesty_flags.push("Requires VBA");

  const title_match = titleHit ? 85 : 25;
  const skill_match = Math.min(100, 40 + skillHits * 15);
  let fit_score = Math.round(title_match * 0.5 + skill_match * 0.5);
  if (seniority === "above") fit_score -= 30;
  if (location === "out_of_area") fit_score -= 20;
  if (honesty_flags.length) fit_score -= 15;
  fit_score = Math.max(0, Math.min(100, fit_score));

  const recommend =
    fit_score >= 65 && seniority !== "above" && location !== "out_of_area" && honesty_flags.length === 0;

  return JSON.stringify({
    fit_score,
    title_match,
    skill_match,
    seniority_fit: seniority,
    location_fit: location,
    honesty_flags,
    reasons: "Heuristic test reason. Title and skill overlap drive the score.",
    recommend,
  });
}

function assert(name, condition) {
  const mark = condition ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}`);
  if (!condition) process.exitCode = 1;
}

async function main() {
  // Self check: extractJson should survive fences and prose.
  const fenced = "Sure, here you go:\n```json\n{\"fit_score\": 42}\n```";
  assert("extractJson strips fences and prose", extractJson(fenced)?.fit_score === 42);

  const raw = [
    ...normalizeJSearch(jsearchResponse),
    ...normalizeAdzuna(adzunaResponse),
    ...normalizeWorkday(workdayResponse, "Acme Retail", "https://acme.wd5.myworkdayjobs.com"),
  ];
  assert("normalized all source rows", raw.length === 6);

  const deduped = dedupe(raw);
  assert("dedupe collapsed the cross source duplicate", deduped.length === 5);

  const dupeMerged = deduped.find((j) => j.title === "Replenishment Manager");
  assert(
    "merged duplicate records both sources",
    dupeMerged && dupeMerged.sources.includes("jsearch") && dupeMerged.sources.includes("adzuna")
  );

  assert(
    "workday url joins base and external path",
    deduped.some((j) => j.url === "https://acme.wd5.myworkdayjobs.com/job/Bentonville/Manager-Inventory-Management/wd-555")
  );

  const scored = await scoreJobs(deduped, mockCallModel);
  assert("every job received a score object", scored.every((j) => j.score && !j.scoreError));

  const ranked = rankJobs(scored);

  const forecastRole = ranked.find((j) => j.title === "Sr Demand Planning Manager");
  assert(
    "forecasting role flagged for honesty",
    forecastRole.score.honesty_flags.includes("Requires building statistical forecast models from scratch") &&
      forecastRole.score.honesty_flags.includes("Requires Tableau") &&
      forecastRole.score.recommend === false
  );

  const vpRole = ranked.find((j) => j.title === "VP of Supply Chain");
  assert("out of area senior role not recommended", vpRole.score.recommend === false);

  assert(
    "top ranked job is recommended and in NWA",
    ranked[0].score.recommend === true && ranked[0].score.location_fit === "onsite_nwa"
  );

  console.log("\n=== ranked output ===");
  for (const j of ranked) {
    const s = j.score;
    const flags = s.honesty_flags.length ? " | flags: " + s.honesty_flags.join("; ") : "";
    console.log(
      `${String(s.fit_score).padStart(3)} | rec:${s.recommend ? "Y" : "n"} | ${j.title} @ ${j.company} (${j.location}) [${j.sources.join("+")}]${flags}`
    );
  }
}

main();
