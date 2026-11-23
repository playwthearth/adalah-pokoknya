# A Place Beyond Time

A private, multilingual digital sanctuary — minimalist, futuristic, quiet.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # typecheck + production build
```

## Where everything lives

| What | Where |
| --- | --- |
| Letters | `src/data/letters.ts` |
| Memories | `src/data/memories.ts` |
| Playlist | `src/data/playlist.ts` |
| Photographs | `public/assets/images/` |
| Music | `public/assets/music/` (see its README) |
| Interface copy (EN / ID / JA) | `src/i18n/` |
| Name + anniversary defaults | `src/data/site.ts` |
| Colours, type, textures | `src/styles/globals.css` |

Letters, memories, the daily messages and every interface label exist in all
three languages. Add an entry to a data file and it appears in the interface —
no component changes required.

Names and the anniversary date can also be changed at runtime from **Settings**;
those choices are saved in `localStorage` along with the language and volume.

## Private access and shared notes

The site sits behind Supabase email + password sign-in, and the notes you both
write are stored in Supabase. Only the email addresses on the allowlist can read
anything.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql` and run it.
3. Under **Authentication → Providers**, keep **Email** enabled. The sign-in
   method is email + password, so no mail is sent at all — Supabase's built-in
   mailer rate limit never applies.
4. Under **Authentication → Users → Add user**, create one account per person
   with the same email address that is on the allowlist, a password, and
   **Auto Confirm User** ticked. (Without the confirmation the password cannot
   be used.) No redirect URLs are needed for password sign-in.
5. Copy **Project URL** and the **anon public** key from **Project Settings →
API** into `.env.local` (and into the Vercel project's environment variables
for a deployment):

   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   The anon key is public by design — every table is protected by row level
   security.

6. Put the two addresses on the allowlist — either let the first sign-in claim
   the **owner** seat automatically, or insert both rows up front:

   ```sql
   insert into public.members (email, role) values
     ('owner@example.com', 'owner'),
     ('partner@example.com', 'member')
   on conflict (email) do update set role = excluded.role;
   ```

7. The owner can also add or remove the second address in
   **Settings → The two of us**. Anyone whose email is not on the allowlist is
   stopped after signing in.

Both of you can post a **daily note** or a **love message** from the **Notes**
page. The three most recent notes also appear on the dashboard. Each person can
delete only their own notes.

## Privacy

Sign-in and the allowlist are real authentication, and Supabase row level
security keeps letters, photographs and notes readable only by the two listed
addresses. The photographs and audio still live in the build, so keep the
repository private if they are personal. Never commit a Supabase **service
role** key — the browser only ever needs the anon key.
