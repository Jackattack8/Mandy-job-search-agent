# Job search agent (v1)

A daily pipeline that pulls supply chain and logistics postings from JSearch,
Adzuna, and a Workday employer watchlist, scores each one against your profile
with Claude, and surfaces a ranked list. Roles that would require something you
cannot truthfully claim (building statistical forecast models from scratch,
Tableau, VBA) get flagged rather than quietly recommended.

## Layout

```
api/fetch-jobs.js    Fetch and normalize from all sources, dedupe
api/score-jobs.js    Score a jobs array with Claude, return ranked
api/cron.js          Daily orchestrator: fetch, score, store
api/mark-applied.js  Mark a role applied or unapplied
api/applied-urls.js  Return applied urls to hydrate the dashboard
api/mark-ignored.js  Mark a role ignored or unignored
api/ignored-urls.js  Return ignored urls to hydrate the dashboard
lib/normalize.js     Source shapes to one schema, plus dedupe
lib/score.js         Prompt, JSON extraction, scoring, ranking
lib/anthropic.js     Anthropic Messages API caller
lib/store.js         Supabase upsert (optional)
src/JobPipeline.jsx  Dashboard table view
test/run.js          Offline pipeline test with fixtures
vercel.json          Daily cron schedule
```

## Run the test

No keys or network needed. This proves normalize, dedupe, JSON extraction,
honesty flags, and ranking all work.

```
node test/run.js
```

## Get the keys

1. JSearch: sign up at RapidAPI, subscribe to the JSearch API free tier, copy
   your RapidAPI key into JSEARCH_RAPIDAPI_KEY.
2. Adzuna: register at developer.adzuna.com, create an app, copy the app id and
   app key.
3. Anthropic: copy your API key into ANTHROPIC_API_KEY. Keep it server side.
4. Supabase (optional but recommended): create a project, then a table:

```
create table job_postings (
  url text primary key,
  title text,
  company text,
  location text,
  posted_at text,
  sources jsonb,
  fit_score int,
  recommend boolean,
  honesty_flags jsonb,
  reasons text,
  applied boolean default false,
  ignored boolean default false,
  seen_at timestamptz
);
```

Copy the service role key into SUPABASE_SERVICE_KEY. The pipeline upserts on
url, so daily runs will not create repeats, and an applied column is included
so you can track which roles you have acted on.

## Add Workday employers

Open a target company career site (most NWA employers use Workday). Open the
browser network tab, search for a role, and look for a request ending in
`/wday/cxs/<tenant>/<site>/jobs`. Add an entry to WORKDAY_WATCHLIST in
api/fetch-jobs.js with the company name, the base host, and that full endpoint.
The request body the code sends is the standard Workday search payload.

## Deploy

```
npm install -g vercel
vercel
```

Add all env vars in the Vercel project settings. The cron in vercel.json runs
api/cron once a day at noon UTC. Adjust the schedule field if you want a
different time.

## Cost

Scoring runs on Haiku, which is cents per few hundred postings. Adzuna and the
JSearch free tier cover a daily run at no cost until you scale volume. To get
richer reasons on your shortlist, score once with Haiku, take the top results,
and re-score just those with a Sonnet caller.
