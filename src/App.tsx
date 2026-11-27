import { MotionConfig, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Ambient } from "./components/Ambient";
import { VineLines } from "./components/Marks";
import { AuthGate } from "./components/AuthGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollProgress } from "./components/ScrollProgress";
import { Ticker } from "./components/Ticker";
import { Footer } from "./components/Footer";
import { MiniPlayer } from "./components/MiniPlayer";
import { Navbar } from "./components/Navbar";
import { site } from "./data/site";
import { AuthProvider } from "./hooks/useAuth";
import { useHashRoute } from "./hooks/useHashRoute";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import { MusicPlayerProvider } from "./hooks/useMusicPlayer";
import { TracksProvider } from "./hooks/useTracks";
import { NotesProvider } from "./hooks/useNotes";
import { NotificationsProvider } from "./hooks/useNotifications";
import { SettingsProvider } from "./hooks/useSettings";
import { recoveryLink } from "./lib/supabase";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";

// The dashboard is the room you land in, so it stays in the entry bundle. The
// other sections load the first time they are opened.
const Letters = lazy(() => import("./pages/Letters").then((m) => ({ default: m.Letters })));
const Memories = lazy(() => import("./pages/Memories").then((m) => ({ default: m.Memories })));
const Notes = lazy(() => import("./pages/Notes").then((m) => ({ default: m.Notes })));
const Playlist = lazy(() => import("./pages/Playlist").then((m) => ({ default: m.Playlist })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));

/** The threshold is shown once per tab, not once per reload. */
const ENTERED_KEY = "abt.entered";

/**
 * A blur over the whole page is a luxury on a phone GPU: the route change
 * still fades and lifts, it just stops paying for a viewport-sized filter.
 */
const canAnimatePageBlur =
  typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;

/** A password link opens onto the form itself, not the threshold page. */
const arrivedFromLink = recoveryLink.kind !== "none";

function readEntered(): boolean {
  try {
    return window.sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8" aria-busy="true">
      <div className="h-3 w-24 animate-pulse bg-line/50" />
      <div className="mt-6 h-10 w-2/3 max-w-md animate-pulse bg-line/40" />
      <div className="mt-10 h-40 animate-pulse border border-line/60 bg-surface/30" />
    </div>
  );
}

function Experience() {
  const [entered, setEntered] = useState(() => readEntered() || arrivedFromLink);
  const [route, navigate] = useHashRoute();
  const { t } = useLanguage();

  useEffect(() => {
    if (!entered) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route, entered]);

  // Each room names itself in the tab and in history.
  useEffect(() => {
    if (!entered) {
      document.title = site.title;
      return;
    }
    document.title =
      route === "dashboard"
        ? site.title
        : route === "not-found"
          ? `${t.notFound.title} — ${site.title}`
          : `${t.nav[route]} — ${site.title}`;
  }, [entered, route, t]);

  const enter = () => {
    setEntered(true);
    try {
      window.sessionStorage.setItem(ENTERED_KEY, "1");
    } catch {
      // Still entered for this render; the flag only helps across reloads.
    }
  };

  // Swapped directly rather than through AnimatePresence: an exit animation
  // that never reports completion (reduced-motion devices) would leave the
  // landing page on screen forever and the app would never mount.
  if (!entered) return <Landing onEnter={enter} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex min-h-[100svh] flex-col"
    >
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.focus();
          main?.scrollIntoView({ block: "start" });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-navy focus:bg-mist focus:px-4 focus:py-2.5 focus:font-mono focus:text-[10px] focus:uppercase focus:tracking-[0.2em] focus:text-ink"
      >
        {t.common.skipToContent}
      </a>

      <Ambient />
      <VineLines className="pointer-events-none fixed -right-10 bottom-16 z-0 hidden h-[58vh] w-[16vw] text-periwinkle/40 lg:block" />
      <ScrollProgress />
      <div className="relative z-10 flex flex-1 flex-col">
        <AuthGate>
          <NotesProvider>
            <NotificationsProvider>
              <Navbar route={route} onNavigate={navigate} />

              <main id="main" tabIndex={-1} className="flex-1 pt-16 outline-none">
                <motion.div
                  key={route}
                  initial={
                    canAnimatePageBlur
                      ? { opacity: 0, y: 14, filter: "blur(6px)" }
                      : { opacity: 0, y: 14 }
                  }
                  animate={
                    canAnimatePageBlur ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ErrorBoundary>
                    <Suspense fallback={<PageFallback />}>
                      {route === "dashboard" && <Dashboard onNavigate={navigate} />}
                      {route === "letters" && <Letters />}
                      {route === "memories" && <Memories />}
                      {route === "playlist" && <Playlist />}
                      {route === "notes" && <Notes />}
                      {route === "settings" && <Settings />}
                      {route === "not-found" && <NotFound onNavigate={navigate} />}
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              </main>

              <Ticker />
              <Footer />
              <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom,0px))]" />
              <MiniPlayer onOpenPlaylist={() => navigate("playlist")} />
            </NotificationsProvider>
          </NotesProvider>
        </AuthGate>
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <TracksProvider>
              <MusicPlayerProvider>
                <ErrorBoundary>
                  <Experience />
                </ErrorBoundary>
              </MusicPlayerProvider>
            </TracksProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}
