# Connecting Supabase (the memory) to your Job Search Agent

This is the last setup step. It gives your tool a memory so that jobs you mark
Applied or Ignore stay hidden day after day instead of coming back each morning.

Plan for about 10 minutes. You will end up with two values that you paste into
Vercel. Work through this top to bottom. You do not need to talk to me between
steps unless something does not match what you see.

What you are getting by the end:
- A free Supabase account and project
- One table that stores your jobs and remembers Applied and Ignore
- Two values: a Project URL and a secret key
- Those two values pasted into Vercel, then one redeploy

***

## Part A. Create a Supabase account

1. Open a new browser tab and go to supabase.com.
2. Click "Start your project" (top right).
3. On the sign in screen, click "Continue with GitHub." This is easiest since
   you already have GitHub. Approve the access it asks for.
4. You are now in the Supabase dashboard.

***

## Part B. Create your project

1. Click the green "New project" button.
2. If it asks you to pick or create an Organization, create one. Name it
   anything, like your own name. Choose the Free plan if it asks.
3. Fill in the project form:
   - Name: type job-search-agent
   - Database Password: click "Generate a password" if there is a button, or
     type any strong password. Save it somewhere just in case, but you will not
     need it for this tool.
   - Region: pick the one closest to you, such as "East US."
4. Click "Create new project."
5. Wait. It takes one to three minutes to build. You will see a spinner or a
   setup screen. Let it finish until the project dashboard appears.

***

## Part C. Create the table

This is where your jobs and their Applied and Ignore status will live. You will
paste in one block of text and click Run. You do not have to understand it.

1. On the left sidebar, click "SQL Editor" (the icon looks like a small page or
   says SQL).
2. Click "New query" if it does not already give you an empty box.
3. Copy the entire block below and paste it into that box:

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

4. Click the "Run" button (usually bottom right of the editor, or press Ctrl
   and Enter together).
5. You should see "Success. No rows returned." That means the table was created.
   This is the result you want.

Note: Supabase may later show a warning that "Row Level Security" is off for
this table. For this tool that is fine and expected, because only your own
server touches the table using the secret key from the next step. You can ignore
that warning.

***

## Part D. Get the two values you need

You need two things from Supabase: the Project URL and a secret key.

1. On the left sidebar, click the gear icon, or "Project Settings," near the
   bottom.
2. Click "API Keys" (on some screens it is called "API").
3. Find "Project URL." It looks like https://abcdefgh.supabase.co. Copy it.
   - This is your SUPABASE_URL.
4. Now the secret key. Look for the server side secret key:
   - If you see a key labeled "secret" that starts with sb_secret_, copy that.
   - If you do not see one, click the "Legacy API Keys" tab and copy the key
     labeled "service_role."
   - Copy whichever of those two you find. Your tool accepts either one.
   - Do NOT copy the "anon" key or the "publishable" key. Those are the wrong
     ones and will not work.
   - This is your SUPABASE_SERVICE_KEY.

Important safety note: that secret key is like a master password to your data.
The only place it should ever go is into Vercel in the next step. Never paste it
into your code, into GitHub, or anywhere public. Your project is already set up
so it will not get uploaded to GitHub by accident.

Paste both values somewhere handy for a moment so you can grab them in Part E:

```
SUPABASE_URL = (the https://...supabase.co value)
SUPABASE_SERVICE_KEY = (the secret or service_role key)
```

***

## Part E. Put the two values into Vercel

1. Go to your Vercel tab. Open your project (project-tgsa5).
2. On the left sidebar, click "Environment Variables."
3. Add the first one:
   - Key: type SUPABASE_URL
   - Value: paste your https://...supabase.co value
   - Make sure Production is selected (ticking all environments is fine too)
   - Click Save or Add
4. Add the second one the same way:
   - Key: type SUPABASE_SERVICE_KEY
   - Value: paste your secret or service_role key
   - Production selected
   - Click Save or Add

Type the names exactly as shown, all capitals with underscores, no spaces. The
code looks for those exact names.

***

## Part F. Redeploy so the new values take effect

Adding values does not apply them on its own. One redeploy does.

1. On the left sidebar, click "Deployments."
2. Find the newest deployment at the top. Click the three dots ("...") on its
   right side.
3. Click "Redeploy," then confirm.
4. Wait one to three minutes until it shows "Ready."

***

## Part G. Check that it worked

1. Open your live site and click "Refresh jobs" to load some roles.
2. Click "Ignore" on a job you do not want. It disappears from the list.
3. Reload the whole page in your browser.
4. Click "Refresh jobs" again. The job you ignored should NOT come back.

If the ignored job stays gone after a reload, the memory is working and you are
completely done. The daily 7 AM run will now keep your list clean on its own.

***

## If something does not work

- The ignored job comes back after reload: the two Supabase values may have a
  typo, or the redeploy did not happen. Recheck the names SUPABASE_URL and
  SUPABASE_SERVICE_KEY in Vercel, then redeploy once more.
- "Refresh jobs" shows an error: take a screenshot of the page and send it over.
- You copied the wrong key (anon or publishable): go back to Part D, get the
  secret or service_role key instead, update it in Vercel, and redeploy.
