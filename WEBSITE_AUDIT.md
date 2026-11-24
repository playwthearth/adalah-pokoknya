# Website Audit — A Place Beyond Time

**Audit Date:** 2026-11-24  
**Live Site:** https://cennaandrin.vercel.app/  
**Role:** Primary Development Agent  
**Scope:** Comprehensive Codebase & Architecture Audit (Non-destructive, zero code modifications)

---

## 1. Executive Summary

"A Place Beyond Time" is a private, multilingual digital sanctuary engineered for two partners. It combines letters, photo memories, an ambient music player, collaborative real-time ephemeral and persistent notes, relationship counters, and a shared astronomical/timezone clock behind Supabase authentication.

The application is themed around an Evangelion / Rei Ayanami aesthetic—clinical, cool-toned, instrument-panel typography (Space Mono, Cormorant Garamond, Inter, Noto Sans JP), scanning reticles, hairlines, and restrained crimson signal accents (`ember`).

The site has clean architectural separation, strong dark-mode implementation with zero flash, thoughtful accessibility primitives (focus traps, skip link, polite announcements), and real-time database synchronization. However, several critical vulnerabilities, performance bottlenecks (uncompressed WAV audio, heavy blur rendering, cascading timer re-renders), mobile safe-area bugs, and functional gaps (inability to edit notes, hardcoded 60-note limits) require systematic remediation.

---

## 2. Framework, Language, and Dependencies

### 2.1 Technology Matrix

| Dimension | Specification | Detail |
| :--- | :--- | :--- |
| **Framework** | React 19.3.1 | Core UI library (`react`, `react-dom`) |
| **Language** | TypeScript ~7.0.2 | Strict mode enabled, project-referenced tsconfigs (`tsconfig.app.json`, `tsconfig.node.json`) |
| **Bundler & Tooling** | Vite 8.3.6 | Fast ESM dev server & Rollup production pipeline |
| **Styling** | Tailwind CSS v4.3.5 | Integrated via `@tailwindcss/vite` using `@theme` and CSS variables |
| **Animation Engine** | Framer Motion 14.14.0 | Declarative spring animations, layout transitions, reduced-motion controls |
| **Iconography** | Lucide React 1.77.0 | SVG feather-derived icons |
| **Backend & Realtime** | Supabase JS 2.119.2 | PostgreSQL, GoTrue Auth, Realtime WebSocket Channels, Storage |
| **Linter / Quality** | oxlint 1.90.0 | High-performance Rust-based linter |
| **Deployment / Host** | Vercel | Single-Page Application deployment |

### 2.2 Dependency Evaluation

- **Zero Heavy Component Libraries:** The project does not rely on bloated UI frameworks like MUI, Ant Design, or Radix UI packages; all modals, lightboxes, buttons, and form inputs are handcrafted.
- **No Third-Party Routing Package:** React Router and TanStack Router are omitted in favor of a lean, custom hash-based hook.
- **Package Health:** All dependencies are on recent modern versions (React 19, Tailwind v4, Vite 8). No deprecated legacy packages were detected.

---

## 3. Project Structure

```
c:\Users\zuree\.freebuff\worktrees\bfbe4ba8\6149568e4fd6542e0093f061baafa9731b25ec7644496a5e
├── index.html                   # HTML entry point with zero-flash theme bootstrap
├── package.json                 # Dependency definitions and NPM scripts
├── vite.config.ts               # Vite bundler plugins (React + Tailwind v4)
├── tsconfig.json                # TypeScript root configuration
├── tsconfig.app.json            # Application client compiler settings
├── tsconfig.node.json           # Tooling/Vite node compiler settings
├── .oxlintrc.json               # Oxlint rules
├── supabase/
│   └── schema.sql               # 364 lines: RLS policies, tables, triggers, and RPC functions
├── public/
│   ├── favicon.svg              # Rei-inspired zero-mark SVG icon
│   └── assets/
│       ├── images/              # 6 sample memory JPGs (~100 KB each)
│       └── music/               # 3 uncompressed WAV audio files (~3.4 MB total)
└── src/
    ├── main.tsx                 # React StrictMode entry & createRoot
    ├── App.tsx                  # Root layout, provider stack, lazy routes, and shell
    ├── types.ts                 # Shared TypeScript interfaces (Note, Memory, Settings, User)
    ├── vite-env.d.ts            # Client environment types
    ├── components/              # 20 modular UI components
    │   ├── Ambient.tsx          # Floating GPU background particles, scans, and blurs
    │   ├── AuthGate.tsx         # Supabase authentication & membership enforcement gate
    │   ├── Clock.tsx            # Zoned digital HUD clock with date sub-readout
    │   ├── CountUp.tsx          # Animated odometer-style numerical counter
    │   ├── EmptyState.tsx       # Standardized empty list state indicator
    │   ├── Footer.tsx           # Global footer with Rei sign-off and copyright
    │   ├── LanguageSelector.tsx # Dropdown language picker (en, id, ja)
    │   ├── LetterCard.tsx       # Envelope/index card preview for static letters
    │   ├── Lightbox.tsx         # Fullscreen accessible photo viewer with pan/zoom
    │   ├── MemoryCard.tsx       # Timeline photo memory card with crop viewfinder
    │   ├── MemoryEditor.tsx     # Full modal form for creating/editing memories
    │   ├── MiniPlayer.tsx       # Fixed persistent bottom audio control bar
    │   ├── Modal.tsx            # Accessible modal dialog with focus-trap and scroll-lock
    │   ├── MusicPlayer.tsx      # Full-page dedicated audio deck with waveform bars
    │   ├── Navbar.tsx           # Desktop and mobile responsive HUD navigation header
    │   ├── PhotoCropper.tsx     # Canvas-based client-side image crop tool
    │   ├── PlayerArtwork.tsx    # Vinyl/HUD square album cover presentation
    │   ├── ReiMarks.tsx         # Evangelion SVGs (ZeroMark, HairLines, MoonMark, CornerTicks)
    │   ├── Reveal.tsx           # Scroll-triggered view animations
    │   ├── ScrollProgress.tsx   # Top 1px reading progress bar
    │   ├── SectionHeader.tsx    # Standardized section header with Japanese subtitle
    │   ├── Ticker.tsx           # Infinite marquee quotes and system alerts
    │   └── TypingText.tsx       # Dynamic typewriter effect for greetings
    ├── data/
    │   ├── letters.ts           # Curated love letters in en, id, and ja
    │   ├── playlist.ts          # Curated audio metadata (title, artist, src, duration)
    │   └── site.ts              # Global constants, initial dates, and greetings
    ├── hooks/
    │   ├── useAuth.tsx          # Authentication context, session lifecycle, and roles
    │   ├── useFocusTrap.ts      # Accessibility hook trapping keyboard focus in dialogs
    │   ├── useHashRoute.ts      # Custom hash router listening to window.location.hash
    │   ├── useLanguage.tsx      # i18n translation provider and locale persistence
    │   ├── useMemories.ts       # Supabase CRUD hook for memory records and photo uploads
    │   ├── useMusicPlayer.tsx   # HTML5 audio controller with persistent time & track
    │   ├── useNoteAuthorName.ts # Name resolution helper (seat owner vs recipient)
    │   ├── useNotes.tsx         # Supabase notes CRUD, realtime channel, and purge timer
    │   ├── useNow.ts            # Ticking clock hook (1-second and 15-second intervals)
    │   ├── useSettings.tsx      # Shared preferences (time zone, relationship anniversary date)
    │   └── useTheme.tsx         # Dark / Light / System theme controller
    ├── i18n/
    │   ├── en.ts                # English translations
    │   ├── id.ts                # Indonesian translations
    │   ├── ja.ts                # Japanese translations
    │   └── index.ts             # Dictionary barrel file
    ├── lib/
    │   └── supabase.ts          # Typed Supabase client singleton
    ├── pages/
    │   ├── Dashboard.tsx        # Relationship command center, live counters, and status HUD
    │   ├── Landing.tsx          # Cinematic entry threshold with zero-mark typography
    │   ├── Letters.tsx          # Archived personal letters with category filtering
    │   ├── Memories.tsx         # Vertical photo timeline archive with lightbox
    │   ├── Notes.tsx            # Realtime collaborative message board (daily & love notes)
    │   ├── Playlist.tsx         # Dedicated listening room and player controls
    │   └── Settings.tsx         # System configuration, member invites, audio, timezone
    ├── styles/
    │   ├── globals.css          # Tailwind directives, custom utilities, base layers
    │   └── theme-dark.css       # CSS variable overrides for dark theme palette
    └── utils/
        └── format.ts            # IANA timezone calculations, civil dates, relative time
```

---

## 4. Routing Architecture

### 4.1 Implementation Mechanism

Routing is powered by a custom hash router (`src/hooks/useHashRoute.ts`):
- Supported routes: `dashboard`, `letters`, `memories`, `playlist`, `notes`, `settings`.
- URLs follow the pattern `https://cennaandrin.vercel.app/#/notes`.
- Listening mechanism: Attaches to the native `window.addEventListener("hashchange", ...)`.
- Fallback behavior: Unrecognized hashes fall back silently to `"dashboard"`.

### 4.2 Application Mounting & Threshold Flow

1. **Threshold (`Landing.tsx`):**
   - The root component checks `sessionStorage.getItem("abt.entered")`.
   - If missing, the cinematic `Landing` component mounts.
   - Clicking "Enter" writes `"1"` to `sessionStorage` and activates the main interface.
2. **Access Gate (`AuthGate.tsx`):**
   - Once inside, `AuthGate` validates the Supabase session and checks if the authenticated user is on the approved `members` allowlist.
   - States: `loading` (spinner), `signedOut` (login card), `pending` (unauthorized user awaiting access), `ready` (renders children), `unconfigured` (missing `.env` keys).
3. **Lazy-Loaded Page Slot (`App.tsx`):**
   - `Dashboard` is bundled into the main chunk for instant first paint.
   - `Letters`, `Memories`, `Notes`, `Playlist`, and `Settings` are loaded via `React.lazy()` with a pulsing fallback skeleton.

### 4.3 Routing Shortcomings

- **Silent 404s:** Visiting invalid paths like `#/unknown` or `#/test` silently displays the Dashboard without informing the user that the requested page does not exist.
- **No Query Parameter or Deep Link Support:** Modals (e.g., opening a specific letter, note, or memory) exist only in ephemeral React state; reloading the page loses modal context.

---

## 5. Visual Design System and CSS Architecture

### 5.1 Rei Ayanami Color Palette

The aesthetic centers around cool hospital/laboratory whites, deep oceanic navy, cyan hair highlights, and emergency EVA-00 crimson:

| Color Token | Light Value | Dark Value | Conceptual Purpose |
| :--- | :--- | :--- | :--- |
| `mist` | `#f4f7fa` | `#111b25` | Canvas background, fog, isolation |
| `pale` | `#dceaf1` | `#192633` | Subsurface, muted panel fill |
| `cyan` | `#a8c9da` | `#83afc7` | Rei's hair, cool instrument glow |
| `surface` | `#ffffff` | `#192633` | Elevated card container |
| `line` | `#dfe7ec` | `#2c3d4d` | Precision 1px grid border |
| `navy` | `#263746` | `#e6edf2` | Primary body typography |
| `ink` | `#1d2c3a` | `#f2f6fa` | Display titles, maximum contrast |
| `ember` | `#a3262f` | `#d0616a` | EVA-00 emergency red, alert signal dot |

### 5.2 Typography System

- **Display Serif:** `Cormorant Garamond` (300/400/500 italic) — used for emotional headings and large numbers.
- **Body Sans:** `Inter` (300/400/500) — clean, readable interface copy.
- **Monospace HUD:** `Space Mono` (400) — uppercase metadata labels, serial markers (`00 / 零`), timers, and coordinates.
- **Japanese Decorative:** `Noto Sans JP` (300/400) — vertical Japanese glyphs and subtitles.

### 5.3 CSS Techniques & Custom Utilities

Tailwind CSS v4 is configured with bespoke utilities in `globals.css`:
- `.surface`: Glassmorphism using `linear-gradient`, `box-shadow`, and inner border highlights.
- `.hair-rule`: 1px gradient divider fading to crimson.
- `.hud-grid`: 24px subtle background grid lines resembling an avionics console.
- `.hero-halo`: Breathing radial gradient glow behind primary titles.
- `.rail`: Crimson left-edge indicator appearing on list item hover.

---

## 6. Page & Component Inventory

### 6.1 Pages

1. **`Landing.tsx` (Threshold):**
   - Minimalist full-viewport cinematic gate featuring ambient particles, a live clock in the shared timezone, Rei SVG marks (`MoonMark`, `HairLines`, `ZeroMark`), and an "Enter Sanctuary" action.
2. **`Dashboard.tsx` (Sanctuary HUD):**
   - Dynamic greeting based on time of day and signed-in partner.
   - Relationship day counter (`CountUp`) computing elapsed days, hours, and minutes since `startDate`.
   - Next anniversary countdown.
   - Daily rotating message indexed by day-of-year.
   - System telemetry panel (online status, signal, archive size, coordinates).
   - Recent notes preview cards and quick-jump navigation cards.
3. **`Letters.tsx` (Archive of Letters):**
   - Static letters categorized by `love`, `birthday`, `encouragement`, `thoughts`, and `special`.
   - Localized per active language (`en`, `id`, `ja`).
   - Modal reading view with full letter formatting.
4. **`Memories.tsx` (Photo Archive):**
   - Alternating vertical timeline layout with dates, titles, and captions.
   - Viewfinder HUD overlays and zoom hover effects.
   - Lightbox modal with keyboard navigation.
   - Supabase Storage image upload and cropping interface (`MemoryEditor`).
5. **`Notes.tsx` (Realtime Board):**
   - Daily ephemeral notes (expire at midnight) and persistent love notes.
   - Filter by type, search bar, character counter, delete confirmation, and modal viewer.
6. **`Playlist.tsx` (Listening Room):**
   - Dedicated music deck with full playback transport, seekbar, volume, track list, and animated equalizer bars.
7. **`Settings.tsx` (System Configuration):**
   - Account seat status, member access management (owner only), theme toggle, language picker, master volume, IANA timezone selector with live time preview, and factory reset.

### 6.2 Key Components

- **`Ambient.tsx`:** Floating CSS-animated light specks, blurred gradient blobs, and monitor scanlines.
- **`AuthGate.tsx`:** Protects private content, handles sign-in forms, and manages member onboarding.
- **`Clock.tsx`:** Monospace digital clock computing time in the configured IANA timezone.
- **`CountUp.tsx`:** Smooth numerical count-up effect with tabular numbers.
- **`EmptyState.tsx`:** Minimalist graphic state with HUD crosshairs when data collections are empty.
- **`Lightbox.tsx`:** Fullscreen photo inspection modal with keyboard bindings (`Escape`, `ArrowLeft`, `ArrowRight`).
- **`MemoryEditor.tsx`:** Canvas photo cropper and metadata form for new memories.
- **`MiniPlayer.tsx`:** Persistent 64px bottom HUD bar allowing continuous audio playback across page navigation.
- **`Modal.tsx`:** Universal dialog wrapper with focus trapping and ESC key dismissal.
- **`Navbar.tsx`:** Top HUD navigation bar with active route underline, language selector, theme toggle, and mobile menu drawer.
- **`ReiMarks.tsx`:** Handcrafted SVG geometric motifs (Unit 00 icon, hair strands, corner brackets, and moon phase).
- **`Ticker.tsx`:** Infinite marquee bar displaying system statuses and poetic thoughts.

---

## 7. Deep Dive: Homepage Review (`Landing.tsx` & `Dashboard.tsx`)

### 7.1 Landing Page (`Landing.tsx`)

- **Strengths:**
  - High aesthetic impact: creates an intimate, cinematic entry into the website.
  - Proper use of `sessionStorage` ensures returning visitors on the same browser tab are not forced to re-enter the threshold.
  - Reduced-motion accessibility is implemented via `useReducedMotion()`.
- **Issues & Observations:**
  - **No Skip Link on Landing:** The `<a href="#main">` skip link is rendered in `App.tsx` *after* the landing threshold is bypassed. Keyboard users on the landing screen have to tab through background elements.
  - **Hardcoded Japanese Glyphs:** The vertical `零` (Zero) symbol on line 45 is hardcoded and does not adapt to language context.
  - **Mobile Layout Constraints:** On small viewports (<360px width), the header clock and Unit 00 badge wrap awkwardly, creating a cramped vertical layout.

### 7.2 Dashboard Page (`Dashboard.tsx`)

- **Strengths:**
  - **Personalized Context:** Seamlessly identifies whether the logged-in user is the owner or partner seat and displays personalized greetings via `TypingText`.
  - **Zoned Calculation Accuracy:** The elapsed relationship counter and anniversary countdown calculate against the shared IANA timezone (`civilMs(zoneNow)`), preventing calendar-day discrepancies between partners in different time zones.
- **Issues & Observations:**
  - **Cascading Re-render Bottleneck:** `useNow()` updates every 1,000 milliseconds. Because `Dashboard` directly consumes `now`, the entire component—including the greeting, system status rows, anniversary math, and all child cards—re-evaluates every second.
  - **Inconsistent Card Widths:** Dashboard uses `max-w-6xl`, while other pages use `max-w-4xl`. When navigating from Dashboard to Notes, the content shifts inward by 256px.
  - **Anniversary Calculation Edge Case:** When the anniversary falls on a leap day (Feb 29), calculations in non-leap years can produce unexpected offsets.

---

## 8. Deep Dive: Notes Page Review (`#/notes`)

The Notes page is the central collaborative communication feature between the two users.

### 8.1 Functional Architecture

- **Two Distinct Note Archetypes:**
  1. `daily`: Ephemeral notes intended for quick thoughts. Expire and disappear automatically at midnight in the shared timezone. Notes posted after 18:00 display a warning badge: "Fades tonight at midnight".
  2. `love`: Permanent romantic notes stored indefinitely in the database.
- **Realtime Synchronization:**
  - Subscribes to Supabase Realtime channel (`notes-realtime-channel`) listening for `INSERT` and `DELETE` database mutations.
  - Features an automatic 60-second prune timer that purges expired daily notes from React state in real time without requiring a full page refresh.

### 8.2 Issues & Vulnerabilities in Notes

1. **Global Stale Delete State:**
   - In `Notes.tsx`, `const [confirmId, setConfirmId] = useState<string | null>(null)` tracks note deletion.
   - Clicking "Delete" arms the confirmation ("Confirm delete?"). If the user clicks "Delete" on Note A and then clicks "Delete" on Note B, Note B becomes armed while Note A silently disarms without visual feedback. If the user clicks elsewhere, the button remains armed indefinitely because there is no auto-reset timeout.
2. **Absence of Note Editing:**
   - Notes are immutable once created. Users cannot edit typos or append thoughts; their only option is to delete the note and post a new one.
3. **Hard 60-Note Query Cap:**
   - In `useNotes.tsx`, queries are hardcoded to `.limit(60)`. As the couple uses the app, older permanent love notes will permanently drop off the bottom of the list without pagination or an archive viewer.
4. **Debounce-Free Search Filter:**
   - Text filtering executes on every single keystroke. While manageable at 60 items, this blocks the main thread when typing quickly on lower-end mobile devices.
5. **Form Error Linkage:**
   - While the textarea has `aria-describedby="note-composer-meta"`, the post error message (`{postError && <p role="alert">...}`) is not linked to the input via `aria-errormessage`.

---

## 9. Mobile Responsiveness Evaluation

### 9.1 Critical Issues

1. **MiniPlayer Content Occlusion on iOS:**
   - `MiniPlayer.tsx` applies `pb-[env(safe-area-inset-bottom)]` to position itself cleanly above the iOS home indicator bar (total height ~84px–96px on iPhone 12–16).
   - In `App.tsx`, the bottom layout spacer is hardcoded to `h-16` (64px). As a result, the bottom 20px–32px of every page (including the last note or footer) is hidden behind the player.
2. **Music Player Overflow on Short Screens:**
   - In `Playlist.tsx` and `MusicPlayer.tsx`, the artwork and track list stack vertically below the `md` breakpoint. On mobile devices held in landscape or on compact phones (e.g., iPhone SE), the controls overflow far below the viewport, requiring excessive vertical scrolling.
3. **Memory Timeline Offset on Small Screens:**
   - On screens narrower than 360px, the timeline bar (`left-[7px]`) and list item padding (`pl-7`) leave minimal horizontal space for cards, causing date badges and titles to wrap into narrow, multi-line blocks.

### 9.2 Moderate Issues

4. **Coarse Touch Targets:**
   - Category filter buttons on `Notes.tsx` and `Letters.tsx` have vertical padding of `py-1.5` (~32px total rendered height), falling below the Apple Human Interface Guidelines and WCAG 2.1 recommended minimum touch target of 44×44px.
5. **Mobile Navigation Breakpoint Gap:**
   - Desktop nav links are set to `hidden lg:flex`. Tablets in portrait orientation (768px to 1023px) are forced into the mobile slide-out drawer despite having ample horizontal screen real estate.

---

## 10. Accessibility (a11y) Evaluation

### 10.1 Positive Compliance

- Skip link (`#main`) allows keyboard users to bypass header navigation.
- Full ARIA semantics across custom components: `aria-pressed`, `aria-current="page"`, `aria-modal="true"`, `aria-live="polite"`.
- Focus trap utility (`useFocusTrap.ts`) keeps focus contained inside modals.
- Respects `prefers-reduced-motion` across both CSS keyframes and Framer Motion transitions.

### 10.2 Non-Compliant Items (WCAG 2.1 AA)

1. **Sub-12px Font Sizes for Metadata:**
   - Widespread use of `text-[9px]`, `text-[10px]`, and `text-[11px]` for system labels, dates, and author badges. These fall below the recommended 12px threshold for comfortable readability.
2. **Contrast Failures on Small Text:**
   - Label color `muted-strong` (`#566a78`) against background `mist` (`#f4f7fa`) yields a contrast ratio of 4.6:1. While passing AA for regular 14pt+ text, it fails the 7:1 ratio required for AAA and is difficult to decipher at 9px.
3. **Global Keyboard Listener Collisions:**
   - In `Lightbox.tsx`, arrow keys (`ArrowLeft`, `ArrowRight`) are bound directly to `document`. When navigating inside inputs or select elements within other open dialogs, these key listeners can unintentionally trigger background photo switches.

---

## 11. Performance & Runtime Bottlenecks

### 11.1 Audio Asset Overhead

- The three placeholder audio tracks in `public/assets/music/` are uncompressed WAV files:
  - `track1.wav`: ~1.1 MB
  - `track2.wav`: ~1.2 MB
  - `track3.wav`: ~1.1 MB
  - **Total:** ~3.4 MB uncompressed audio.
- Converting these to 128kbps AAC/MP3 or Opus/OGG would reduce the asset size to ~350 KB per track (~1 MB total), yielding an immediate **70% bandwidth reduction**.

### 11.2 Rendering & GPU Load

- **Ambient Blur GPU Strain:** `Ambient.tsx` renders 4 radial gradient blobs with blur filters up to `blur-[110px]` alongside an infinite `sweep` gradient and scanlines. On mobile GPUs, high-radius blurs force costly offscreen buffer passes that cause frame drops during scrolling.
- **Unmemoized List Items:** `NoteCard`, `MemoryCard`, and `LetterCard` are not memoized with `React.memo`. When `useNow()` ticks every second, every visible card in the DOM re-executes its render cycle.

### 11.3 Database Polling Redundancy

- The application runs **three simultaneous 10-second polling loops**:
  1. `useNotes.tsx`: 10-second poll fallback alongside WebSocket realtime.
  2. `useSettings.tsx`: 10-second poll fallback.
  3. `useMemories.ts`: 10-second poll fallback.
- Even when the user is idle, three network requests fire every 10 seconds. These should be relaxed to 30–60 seconds, paused during background tabs via the Page Visibility API, or deferred entirely to Supabase Realtime channels.

---

## 12. Security, Authentication & Data Model

### 12.1 Security Strengths

- Strict Row-Level Security (RLS) policies defined in `supabase/schema.sql` on all tables (`members`, `notes`, `settings`, `memories`).
- Photo storage bucket is private; files are served using time-limited signed URLs (2-hour expiry).
- Note deletion is strictly verified: `auth.uid() = author_id`.
- Site is tagged with `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing.

### 12.2 Security & Data Observations

- **RLS Policy on Settings:** All members can update settings. While fine for a 2-person relationship app, concurrent writes to `recipient` or `startDate` could lead to race conditions.
- **Stored XSS Resilience:** Note content is rendered strictly via JSX text nodes (`{note.body}`), ensuring automatic HTML entity escaping by React.

---

## 13. Audit Conclusion & Findings Matrix

| Domain | Assessment | Urgent Action Items |
| :--- | :--- | :--- |
| **Visual Design** | Exceptional (Evangelion HUD theme) | Resolve page max-width discrepancies; normalize filter chip styling |
| **Notes System** | High utility, moderate fragility | Add auto-reset to delete confirmation; introduce note editing; add pagination |
| **Navigation** | Clean, lightweight | Add dedicated 404 screen; expand desktop nav to tablets |
| **Responsiveness** | Good on desktop, flawed on iOS | Fix MiniPlayer bottom spacer for safe-area-inset; fix mobile timeline squeeze |
| **Performance** | Adequate, asset-heavy | Convert 3.4 MB WAV files to MP3/OGG; throttle 1s Dashboard re-renders; consolidate polls |
| **Accessibility** | Thoughtful foundations | Increase 9px/10px font sizes; resolve low-contrast metadata labels |
