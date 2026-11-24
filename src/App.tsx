import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Ambient } from "./components/Ambient";
import { HairLines } from "./components/ReiMarks";
import { AuthGate } from "./components/AuthGate";
import { ScrollProgress } from "./components/ScrollProgress";
import { Ticker } from "./components/Ticker";
import { Footer } from "./components/Footer";
import { MiniPlayer } from "./components/MiniPlayer";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./hooks/useAuth";
import { useHashRoute } from "./hooks/useHashRoute";
import { LanguageProvider } from "./hooks/useLanguage";
import { MusicPlayerProvider } from "./hooks/useMusicPlayer";
import { NotesProvider } from "./hooks/useNotes";
import { SettingsProvider } from "./hooks/useSettings";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { Letters } from "./pages/Letters";
import { Memories } from "./pages/Memories";
import { Notes } from "./pages/Notes";
import { Playlist } from "./pages/Playlist";
import { Settings } from "./pages/Settings";

function Experience() {
  const [entered, setEntered] = useState(false);
  const [route, navigate] = useHashRoute();

  useEffect(() => {
    if (!entered) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route, entered]);

  const enter = () => {
    setEntered(true);
    navigate("dashboard");
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
      <Ambient />
      <HairLines className="pointer-events-none fixed -right-10 bottom-16 z-0 hidden h-[58vh] w-[16vw] text-cyan/45 lg:block" />
      <ScrollProgress />
      <div className="relative z-10 flex flex-1 flex-col">
        <AuthGate>
        <NotesProvider>
          <Navbar route={route} onNavigate={navigate} />

          <main className="flex-1 pt-16">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {route === "dashboard" && <Dashboard onNavigate={navigate} />}
              {route === "letters" && <Letters />}
              {route === "memories" && <Memories />}
              {route === "playlist" && <Playlist />}
              {route === "notes" && <Notes />}
              {route === "settings" && <Settings />}
            </motion.div>
          </main>

          <Ticker />
          <Footer />
          <div aria-hidden="true" className="h-16" />
          <MiniPlayer onOpenPlaylist={() => navigate("playlist")} />
        </NotesProvider>
        </AuthGate>
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <MusicPlayerProvider>
            <Experience />
          </MusicPlayerProvider>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
