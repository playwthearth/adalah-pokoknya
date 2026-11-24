# Implementation Plan — A Place Beyond Time

**Date:** 2026-11-24  
**Project:** A Place Beyond Time (https://cennaandrin.vercel.app/)  
**Role:** Primary Development Agent  
**Reference Document:** [WEBSITE_AUDIT.md](file:///c:/Users/zuree/.freebuff/worktrees/bfbe4ba8/6149568e4fd6542e0093f061baafa9731b25ec7644496a5e/WEBSITE_AUDIT.md)

---

## Plan Structure & Methodology

This implementation plan is organized into the six priority categories requested for the project:
1. **Visual Improvements**
2. **Notes Page Improvements**
3. **Navigation Improvements**
4. **Responsive Design**
5. **Personal Features**
6. **Technical Improvements**

For every recommendation, we define:
- **Impact:** The tangible benefit to user experience, reliability, aesthetic fidelity, or performance.
- **Complexity:** Estimated development time, scope of files touched, and technical difficulty.
- **Potential Risks:** Potential breaking changes, layout shifts, or edge cases, along with explicit mitigations.
- **Action Plan:** Concrete implementation steps and file locations.

---

## 1. Visual Improvements

Visual cohesion is essential to preserving the site's Rei Ayanami / Evangelion aesthetic while eliminating visual jarring across page transitions.

### 1.1 Standardize Container Max-Widths Across Pages

- **Problem:** Currently, `Dashboard.tsx` and `Memories.tsx` use `max-w-6xl` (1152px), while `Notes.tsx`, `Letters.tsx`, and `Settings.tsx` use `max-w-4xl` (896px). Navigating between pages causes a 256px horizontal jump in content margins.
- **Impact:** **Medium** — Delivers a polished, uniform visual rhythm across all views without jarring layout shifts.
- **Complexity:** **Low** — Update Tailwind container utility classes in `src/pages/*.tsx`.
- **Potential Risks:**
  - *Risk:* Expanding `Notes.tsx` or `Letters.tsx` to `max-w-6xl` could result in line lengths exceeding optimal typographic readability (60–75 characters per line).
  - *Mitigation:* Standardize on `max-w-5xl` (1024px) for reading-heavy views or maintain a structured multi-column layout on wide screens.
- **Target Files:** `src/pages/Dashboard.tsx`, `src/pages/Notes.tsx`, `src/pages/Letters.tsx`, `src/pages/Settings.tsx`.

---

### 1.2 Unify Filter Chip Geometry and Spacing

- **Problem:** Filter buttons in `Letters.tsx` use `px-3 py-2 text-xs`, whereas `Notes.tsx` filters use `px-3 py-1.5 text-[9px]`. This inconsistency breaks component reuse and creates uneven visual weight.
- **Impact:** **Low to Medium** — Enhances design consistency and ensures touch targets remain accessible.
- **Complexity:** **Low** — Extract a shared `FilterChip` component or standardize Tailwind utility classes.
- **Potential Risks:**
  - *Risk:* Changing vertical padding might cause filter rows to wrap onto multiple lines on small mobile devices.
  - *Mitigation:* Test horizontal flex layouts with `flex-wrap gap-2` on 375px viewports.
- **Target Files:** `src/pages/Notes.tsx`, `src/pages/Letters.tsx`, `src/pages/Memories.tsx`.

---

### 1.3 Move Hardcoded Japanese Glyphs into Translation Dictionaries

- **Problem:** Decorative Japanese kanji (e.g., `零` in `Landing.tsx`, `便り` in `Notes.tsx`, `今日の言葉` in `Dashboard.tsx`, and `愛を込めて` in `Letters.tsx`) are hardcoded directly into JSX rather than managed through the i18n system.
- **Impact:** **Medium** — Ensures stylistic glyphs can be controlled, customized, or translated systematically while maintaining visual harmony in English, Indonesian, and Japanese modes.
- **Complexity:** **Low** — Add dictionary keys to `src/i18n/en.ts`, `src/i18n/id.ts`, and `src/i18n/ja.ts`.
- **Potential Risks:**
  - *Risk:* Missing translation keys in any dictionary file will cause TypeScript compilation failures.
  - *Mitigation:* Ensure strict TypeScript typing against the translation interface in `src/i18n/index.ts`.
- **Target Files:** `src/i18n/en.ts`, `src/i18n/id.ts`, `src/i18n/ja.ts`, `src/pages/Landing.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Notes.tsx`.

---

### 1.4 Elevate Metadata Contrast and Text Hierarchy

- **Problem:** Extensive use of `text-[9px]` and `text-[10px]` with color `text-muted-strong` (`#566a78`) on `mist` background (`#f4f7fa`) creates poor legibility in daylight environments (contrast ~4.6:1, below AAA standards).
- **Impact:** **High** — Substantially improves legibility for labels, dates, serial numbers, and counters without losing the clinical HUD feel.
- **Complexity:** **Low to Medium** — Adjust font size tokens from 9px/10px to 11px/12px and deepen `muted-strong` to `#3d4f5c` in light mode.
- **Potential Risks:**
  - *Risk:* Larger font sizes could cause tight HUD panels (such as `Clock.tsx` or `MiniPlayer.tsx`) to wrap or overflow.
  - *Mitigation:* Apply subtle letter-spacing adjustments (`tracking-[0.14em]`) when increasing font size to 11px.
- **Target Files:** `src/styles/globals.css`, `src/styles/theme-dark.css`, `src/components/Clock.tsx`, `src/components/MiniPlayer.tsx`.

---

## 2. Notes Page Improvements (`#/notes`)

As the core realtime collaborative space for the two users, the Notes page requires immediate functional polish and reliability enhancements.

### 2.1 Auto-Resetting Delete Confirmation State

- **Problem:** Clicking "Delete" on a note sets `confirmId` to that note's ID. If the user clicks elsewhere, leaves the tab, or clicks another note, the confirmation stays armed indefinitely, leading to accidental deletions if clicked later.
- **Impact:** **High** — Eliminates accidental note loss and prevents confusing UI states where an action appears armed unexpectedly.
- **Complexity:** **Low** — Add a 5-second `setTimeout` auto-reset and clear `confirmId` on filter change, search query change, or scroll.
- **Potential Risks:**
  - *Risk:* Timer cleanup failure could trigger state updates on unmounted components.
  - *Mitigation:* Store the timeout ID in a `useRef` and ensure proper cleanup in `useEffect`.
- **Target Files:** `src/pages/Notes.tsx`.

---

### 2.2 In-Place Note Editing Capability

- **Problem:** Notes currently support only Create and Delete. If a user makes a typo in a love note or wants to append thoughts to an existing note, they must delete it entirely and start over, losing the original creation timestamp.
- **Impact:** **High** — Highly requested everyday personal feature that makes the board significantly more pleasant to use.
- **Complexity:** **Medium** — 
  1. Add an `updateNote(id, { body, kind })` mutation in `src/hooks/useNotes.tsx`.
  2. Add an "Edit" action button (pencil icon) visible to the author.
  3. Support an "editing mode" in the composer or an inline editor inside `Modal.tsx`.
- **Potential Risks:**
  - *Risk:* Editing an expiring `daily` note could cause timestamp ambiguity.
  - *Mitigation:* Preserve the original `created_at` timestamp and store an optional `updated_at` column in Supabase.
- **Target Files:** `src/pages/Notes.tsx`, `src/hooks/useNotes.tsx`, `supabase/schema.sql`.

---

### 2.3 Debounced Search and Instant Filter Feedback

- **Problem:** Search filtering currently executes on every raw keystroke in `useMemo`. While acceptable for 10 notes, fast typing on mobile can stutter. Furthermore, when search results are empty, the empty state text uses a generic label rather than a helpful contextual hint.
- **Impact:** **Medium** — Smoother typing experience on mobile devices and clearer feedback when queries yield zero results.
- **Complexity:** **Low** — Introduce a 150ms debounce on the search query input and refine empty state copy.
- **Potential Risks:**
  - *Risk:* Slight visual delay between typing and filter list update.
  - *Mitigation:* Keep debounce duration short (150ms) so it feels instantaneous to human perception while preventing per-keystroke filter calculations.
- **Target Files:** `src/pages/Notes.tsx`.

---

### 2.4 Pagination or Dynamic Archive for Long-Term Notes

- **Problem:** `useNotes.tsx` hardcodes `.limit(60)`. As the couple continues writing permanent `love` notes, older cherished notes will silently disappear from the board forever.
- **Impact:** **High** — Protects the long-term emotional history and archive of the couple's relationship.
- **Complexity:** **Medium** — Implement a "Load earlier notes" button or cursor-based pagination fetching in batches of 30.
- **Potential Risks:**
  - *Risk:* Mixing realtime subscriptions with paginated historical data can cause duplicate items if keys are not deduplicated.
  - *Mitigation:* Use an ID-keyed `Map` or Set to deduplicate fetched historical records against realtime incoming records.
- **Target Files:** `src/hooks/useNotes.tsx`, `src/pages/Notes.tsx`.

---

### 2.5 Refined Midnight Expiry Calculation

- **Problem:** `fadesTonight()` currently checks only `parts.hour >= 18`. A note posted at 14:00 will disappear at midnight, but will not show any expiry warning until 18:00.
- **Impact:** **Low to Medium** — Prevents confusion about when daily notes disappear by showing the actual remaining hours until midnight in the shared timezone.
- **Complexity:** **Low** — Update `fadesTonight` to return the hours remaining until midnight in the shared timezone (e.g., "Fades in 4h").
- **Potential Risks:**
  - *Risk:* Dynamic "hours remaining" strings require continuous re-render.
  - *Mitigation:* Calculate against the existing minute-level time hook.
- **Target Files:** `src/pages/Notes.tsx`.

---

## 3. Navigation Improvements

### 3.1 Dedicated 404 / Route Fallback View

- **Problem:** Typing an invalid hash (e.g., `#/notes-archive` or `#/invalid`) currently falls back silently to `Dashboard`. The user receives no feedback that their link was incorrect or broken.
- **Impact:** **Medium** — Provides clear feedback for broken bookmarks or invalid links, matching modern web application expectations.
- **Complexity:** **Low** — Add a `NotFound` fallback view in `App.tsx` displaying a Rei-styled HUD message ("Location Lost / 404") with a "Return to Dashboard" action.
- **Potential Risks:**
  - *Risk:* Incorrect route parsing could trap valid routes in the 404 view.
  - *Mitigation:* Use strict enum matching against `Route` type (`dashboard | letters | memories | playlist | notes | settings`).
- **Target Files:** `src/App.tsx`, `src/hooks/useHashRoute.ts`.

---

### 3.2 Tablet & Mid-Size Screen Navigation Expansion

- **Problem:** In `Navbar.tsx`, desktop nav links are styled with `hidden lg:flex`. Tablets in portrait orientation (768px–1023px, including iPad) have ample width to display the 5 menu links, yet are forced to open the mobile drawer.
- **Impact:** **Medium** — Dramatically improves tablet navigation speed and reduces unnecessary drawer opening interactions.
- **Complexity:** **Low** — Change breakpoint from `lg:flex` to `md:flex`, adjusting horizontal item gap from `gap-7` to `gap-4` on medium viewports.
- **Potential Risks:**
  - *Risk:* Navbar logo, title, and buttons could collide on 768px screens if language selector is wide.
  - *Mitigation:* Test at 768px width and ensure `min-w-0` truncation on secondary subtitles.
- **Target Files:** `src/components/Navbar.tsx`.

---

### 3.3 Deep Linking for Lightboxes and Modals

- **Problem:** When opening a specific memory or letter, the URL does not update. If the user copies the URL to share with their partner or reloads the tab, the modal closes and the context is lost.
- **Impact:** **Medium** — Allows partners to send direct links to a specific photo, letter, or note (e.g., `#/memories?id=xyz` or `#/letters?slug=anniversary-2025`).
- **Complexity:** **Medium** — Extend `useHashRoute` to parse optional query parameters or sub-routes.
- **Potential Risks:**
  - *Risk:* Adding query parameter parsing to hash routes can complicate the `hashchange` listener.
  - *Mitigation:* Implement a clean URLSearchParams parser on `window.location.hash.split("?")[1]`.
- **Target Files:** `src/hooks/useHashRoute.ts`, `src/pages/Memories.tsx`, `src/pages/Letters.tsx`, `src/pages/Notes.tsx`.

---

## 4. Responsive Design

### 4.1 Fix MiniPlayer Bottom Spacer for iOS Home Indicator (Safe-Area-Inset)

- **Problem:** `MiniPlayer.tsx` applies `pb-[env(safe-area-inset-bottom)]`, raising its height to ~84px–96px on modern iPhones. However, the spacer `div` in `App.tsx` is fixed at `h-16` (64px). This causes the bottom 20px–32px of every page to be covered by the player.
- **Impact:** **High** — Fixes a major visual and interactive bug on iPhones where buttons or text at the bottom of pages cannot be tapped.
- **Complexity:** **Low** — Replace the hardcoded `h-16` spacer with dynamic padding matching the player's full height: `h-[calc(4rem+env(safe-area-inset-bottom,0px))]`.
- **Potential Risks:**
  - *Risk:* Extra whitespace on desktop browsers if `env()` fallback is improperly defined.
  - *Mitigation:* Provide `0px` as the second argument to `env()` so desktop renders standard height.
- **Target Files:** `src/App.tsx`.

---

### 4.2 Music Player Layout Adaptability on Short Viewports

- **Problem:** Below the `md` breakpoint, `MusicPlayer.tsx` stacks the large artwork above the controls and tracklist. On compact phones (e.g., iPhone SE) or landscape mode, the play/pause transport and volume sliders are pushed completely below the fold.
- **Impact:** **High** — Allows seamless music playback control on all mobile screens without aggressive scrolling.
- **Complexity:** **Medium** — On small screens, scale artwork down dynamically (`w-36 h-36` on mobile instead of full width) and place key transport controls immediately adjacent to the track title.
- **Potential Risks:**
  - *Risk:* Overcrowding controls on narrow viewports (<350px).
  - *Mitigation:* Use CSS flexbox with `flex-wrap` and compact spacing tokens.
- **Target Files:** `src/components/MusicPlayer.tsx`.

---

### 4.3 Mobile Memory Timeline Layout Squeeze

- **Problem:** On screens under 360px, the timeline guide line at `left-[7px]` combined with `pl-7` list padding compresses photo cards and text, causing multiline word breaks on dates and titles.
- **Impact:** **Medium** — Smooth, comfortable viewing of photo memories on smaller mobile devices.
- **Complexity:** **Low to Medium** — Adjust timeline margins on small screens or switch to a full-width card layout with a compact top-edge date badge below 400px viewport.
- **Potential Risks:**
  - *Risk:* Breaking the alternating desktop timeline layout.
  - *Mitigation:* Keep the alternating layout scoped to `md:` and above.
- **Target Files:** `src/pages/Memories.tsx`, `src/components/MemoryCard.tsx`.

---

### 4.4 Touch Target Accessibility (44×44px Standard)

- **Problem:** Buttons like the note delete icon (`Trash2`), modal close icons, and filter chips currently measure ~32px to 36px in height, failing WCAG 2.5.5 and Apple HIG standards.
- **Impact:** **Medium** — Dramatically reduces miss-taps and accidental deletions on touchscreens.
- **Complexity:** **Low** — Ensure all clickable elements have pseudo-element touch expanders (`before:absolute before:-inset-2`) or minimum dimensions of `min-h-[44px] min-w-[44px]`.
- **Potential Risks:**
  - *Risk:* Larger visible button boxes could disrupt tight typography.
  - *Mitigation:* Keep visible borders compact while expanding the invisible tap target using pseudo-elements.
- **Target Files:** `src/pages/Notes.tsx`, `src/components/Modal.tsx`, `src/components/MiniPlayer.tsx`.

---

## 5. Personal Features

These features deepen the intimate relationship purpose of "A Place Beyond Time" without adding unnecessary bloat.

### 5.1 Mutual Anniversary Milestone Celebrations

- **Problem:** The anniversary countdown counts down the days until the next milestone, but on the exact date (`left <= 0`), it simply shows a static text message.
- **Impact:** **High** — Creates a special emotional moment for the couple when opening the app on their anniversary.
- **Complexity:** **Medium** — 
  1. Trigger an ambient visual celebration (e.g., gentle slow-motion light particles or a bespoke letter reveal) on anniversary day.
  2. Display a customized milestone message celebrating $N$ years together.
- **Potential Risks:**
  - *Risk:* Flashy or cartoonish animations would clash with the Rei Ayanami clinical aesthetic.
  - *Mitigation:* Keep animations restrained and elegant: soft crimson flares, glowing hairlines, and poetic typography.
- **Target Files:** `src/pages/Dashboard.tsx`, `src/components/ReiMarks.tsx`.

---

### 5.2 Collaborative Photo Memory Tagging / Mood Filter

- **Problem:** Memories are currently organized solely in chronological order. As the archive grows over months and years, finding specific moments (trips, celebrations, quiet days) becomes difficult.
- **Impact:** **Medium** — Makes revisiting memories intuitive and rewarding as the photo collection expands.
- **Complexity:** **Medium** — Add an optional `tag` or `mood` column to `memories` in Supabase (e.g., `journey`, `daily`, `milestone`) with a lightweight filter bar on `Memories.tsx`.
- **Potential Risks:**
  - *Risk:* Adding mandatory fields could introduce friction when uploading a quick photo.
  - *Mitigation:* Make tags strictly optional during memory creation.
- **Target Files:** `src/pages/Memories.tsx`, `src/components/MemoryEditor.tsx`, `supabase/schema.sql`.

---

### 5.3 Daily Note Archive / "On This Day" Throwback

- **Problem:** Daily notes currently disappear at midnight forever. While this ephemeral nature is romantic and encourages frequent posting, meaningful daily thoughts are permanently lost once purged.
- **Impact:** **High** — Retains the daily ephemeral feel while providing a private "Time Capsule" or "On This Day" memory feature for the couple.
- **Complexity:** **Medium to High** — 
  1. Instead of hard-deleting notes via `purge_expired_daily_notes()`, mark them with `archived: true`.
  2. Exclude archived notes from the main board, but feature an "On This Day" memory card on the Dashboard when a note from 1 year ago exists.
- **Potential Risks:**
  - *Risk:* Table size growth over time.
  - *Mitigation:* Even with 2 daily notes per day, 5 years produces only ~3,600 small text rows—negligible for PostgreSQL.
- **Target Files:** `supabase/schema.sql`, `src/hooks/useNotes.tsx`, `src/pages/Dashboard.tsx`.

---

## 6. Technical Improvements

### 6.1 Convert WAV Audio Assets to Modern Compressed Formats (MP3/OGG)

- **Problem:** The three bundled audio files (`track1.wav`, `track2.wav`, `track3.wav`) total ~3.4 MB of uncompressed audio served over the network.
- **Impact:** **High** — Reduces total site asset weight by ~2.5 MB (≈75% reduction), drastically improving initial page speed on mobile data.
- **Complexity:** **Low** — Convert WAV files to 160kbps MP3 and WebM/OGG; update `src/data/playlist.ts`.
- **Potential Risks:**
  - *Risk:* Audio codec compatibility issues on older iOS Safari versions.
  - *Mitigation:* MP3 has 100% universal browser compatibility across all versions of iOS and Android.
- **Target Files:** `public/assets/music/*`, `src/data/playlist.ts`, `src/hooks/useMusicPlayer.tsx`.

---

### 6.2 Implement Global React Error Boundary

- **Problem:** If any unhandled JavaScript exception or network parsing failure occurs during render (e.g., inside an un-migrated note or corrupt localStorage), the entire React 19 tree unmounts, leaving the user with a blank white screen.
- **Impact:** **High** — Prevents total app crashes, gracefully catches rendering exceptions, and offers a branded "Reload Sanctuary" recovery button.
- **Complexity:** **Low** — Create `src/components/ErrorBoundary.tsx` wrapping the page slot in `App.tsx`.
- **Potential Risks:**
  - *Risk:* Suppressing errors without debugging visibility.
  - *Mitigation:* Log caught errors to `console.error` and provide a clean HUD error code display.
- **Target Files:** `src/components/ErrorBoundary.tsx` (new), `src/App.tsx`.

---

### 6.3 Decouple 1-Second Timer from Dashboard Tree

- **Problem:** `useNow()` updates every 1,000 milliseconds to tick the clock. Because `Dashboard.tsx` consumes `useNow()` directly at its root, the entire dashboard (greeting calculation, anniversary formulas, recent notes, and quick action cards) re-renders every single second.
- **Impact:** **High** — Eliminates unnecessary CPU cycles and stops continuous garbage collection on mobile devices, improving battery life.
- **Complexity:** **Medium** — 
  1. Confine the 1-second interval strictly to `Clock.tsx`.
  2. For the Dashboard elapsed counter and greetings, update only every 60 seconds (or compute against a minute-level tick).
  3. Wrap static sections (`QuickLinks`, `SystemRows`) in `React.memo`.
- **Potential Risks:**
  - *Risk:* Clock and day counter drifting out of sync.
  - *Mitigation:* Both read from the same underlying `Date` object and shared timezone calculation utility.
- **Target Files:** `src/hooks/useNow.ts`, `src/pages/Dashboard.tsx`, `src/components/Clock.tsx`.

---

### 6.4 Consolidate Redundant 10-Second Polling Loops

- **Problem:** The app currently runs three independent 10-second polling loops (`useNotes`, `useSettings`, `useMemories`), creating 18 network requests every minute even when realtime WebSockets are connected.
- **Impact:** **High** — Cuts idle network requests by 66–80% and reduces Supabase API usage.
- **Complexity:** **Medium** — 
  1. Extend poll intervals to 30s or 60s when the WebSocket connection is active.
  2. Pause all polling completely when `document.hidden === true` using the Page Visibility API.
- **Potential Risks:**
  - *Risk:* Missing updates if WebSockets disconnect.
  - *Mitigation:* Fallback polling immediately triggers when WebSocket drops or when the tab regains focus.
- **Target Files:** `src/hooks/useNotes.tsx`, `src/hooks/useSettings.tsx`, `src/hooks/useMemories.ts`.

---

### 6.5 Optimize Ambient GPU Layer on Mobile Devices

- **Problem:** `Ambient.tsx` applies multiple heavy CSS filters (`blur-[48px]` to `blur-[110px]`) and infinite CSS keyframe movements. On lower-spec mobile devices, this causes GPU throttling and battery drain.
- **Impact:** **Medium** — Delivers consistent 60fps scrolling performance on mobile without sacrificing the atmospheric aesthetic.
- **Complexity:** **Low to Medium** — On viewports `<640px` or when `navigator.hardwareConcurrency <= 4`, reduce the number of blurred light blobs from 4 to 2 and dial down maximum blur radii.
- **Potential Risks:**
  - *Risk:* Visible difference in background atmosphere between devices.
  - *Mitigation:* Tune mobile opacity slightly higher to preserve atmospheric depth with lower blur radius.
- **Target Files:** `src/components/Ambient.tsx`.

---

## 7. Phased Implementation Roadmap

To ensure zero regressions and safe, reviewable increments, the work is grouped into four execution phases:

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: High-Impact Stability & Quick Wins                 │
│  - 6.2 Global React Error Boundary                          │
│  - 6.1 Audio Compression (WAV → MP3/OGG)                    │
│  - 4.1 MiniPlayer iOS Safe Area Spacer Fix                  │
│  - 2.1 Notes Auto-Reset Delete Confirmation                 │
│  - 1.3 Move Hardcoded Japanese to i18n                      │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: Performance & Mobile Responsiveness                │
│  - 6.3 Decouple 1-Second Timer from Dashboard               │
│  - 6.4 Consolidate & Pause Polling on Hidden Tabs           │
│  - 4.2 Music Player Mobile Layout Refactor                  │
│  - 4.4 Touch Target Size Expansion (44px standard)          │
│  - 6.5 Ambient Layer Mobile GPU Optimization                │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: Core Functional & Navigation Enhancements          │
│  - 2.2 In-Place Note Editing Feature                        │
│  - 2.4 Notes Archive & Pagination                           │
│  - 3.1 Dedicated 404 Route View                             │
│  - 3.2 Tablet Navigation Breakpoint Refinement              │
│  - 1.1 Standardize Container Max-Widths                     │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: Personal Features & Long-Term Polish               │
│  - 5.1 Mutual Anniversary Milestone Celebrations            │
│  - 5.3 Daily Note "On This Day" Archive                     │
│  - 5.2 Memory Tagging & Filtering                           │
│  - 1.4 Elevate Metadata Contrast & Legibility               │
│  - 3.3 Deep Linking for Lightboxes & Modals                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Summary Prioritization Matrix

| ID | Recommendation | Category | Impact | Complexity | Risk | Recommended Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1** | Standardize Container Max-Widths | Visual | Medium | Low | Low | Phase 3 |
| **1.2** | Unify Filter Chip Geometry | Visual | Medium | Low | Low | Phase 2 |
| **1.3** | Move Hardcoded Japanese to i18n | Visual | Medium | Low | Low | Phase 1 |
| **1.4** | Elevate Metadata Contrast & Legibility | Visual | High | Medium | Low | Phase 4 |
| **2.1** | Notes Auto-Reset Delete Confirmation | Notes Page | High | Low | Low | Phase 1 |
| **2.2** | In-Place Note Editing Feature | Notes Page | High | Medium | Medium | Phase 3 |
| **2.3** | Debounced Search on Notes | Notes Page | Medium | Low | Low | Phase 2 |
| **2.4** | Notes Archive & Pagination | Notes Page | High | Medium | Low | Phase 3 |
| **2.5** | Refined Midnight Expiry Calculation | Notes Page | Medium | Low | Low | Phase 2 |
| **3.1** | Dedicated 404 Route View | Navigation | Medium | Low | Low | Phase 3 |
| **3.2** | Tablet Navigation Expansion (md:flex) | Navigation | Medium | Low | Low | Phase 3 |
| **3.3** | Deep Linking for Modals & Lightbox | Navigation | Medium | Medium | Medium | Phase 4 |
| **4.1** | Fix MiniPlayer iOS Safe Area Spacer | Responsive | High | Low | Low | Phase 1 |
| **4.2** | Music Player Mobile Layout Refactor | Responsive | High | Medium | Low | Phase 2 |
| **4.3** | Mobile Memory Timeline Layout Squeeze | Responsive | Medium | Medium | Low | Phase 2 |
| **4.4** | Touch Target Expansion (44×44px) | Responsive | Medium | Low | Low | Phase 2 |
| **5.1** | Mutual Anniversary Milestone Celebration | Personal | High | Medium | Low | Phase 4 |
| **5.2** | Memory Tagging / Mood Filter | Personal | Medium | Medium | Low | Phase 4 |
| **5.3** | Daily Note "On This Day" Archive | Personal | High | High | Medium | Phase 4 |
| **6.1** | WAV Audio to MP3/OGG Compression | Technical | High | Low | Low | Phase 1 |
| **6.2** | Global React Error Boundary | Technical | High | Low | Low | Phase 1 |
| **6.3** | Decouple 1s Timer from Dashboard | Technical | High | Medium | Low | Phase 2 |
| **6.4** | Consolidate 10s Polling Loops | Technical | High | Medium | Medium | Phase 2 |
| **6.5** | Ambient GPU Layer Optimization | Technical | Medium | Low | Low | Phase 2 |
