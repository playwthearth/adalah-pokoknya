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

## Privacy

This is a private place, but a private URL is not authentication. Personal
letters and photographs should not be committed to a public repository. If real
access control is needed, put the site behind server-side authentication (for
example a Cloudflare Access policy) rather than a frontend password.
