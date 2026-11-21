import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { MiniPlayer } from "./components/MiniPlayer";
import { Navbar } from "./components/Navbar";
import { useHashRoute } from "./hooks/useHashRoute";
import { LanguageProvider } from "./hooks/useLanguage";
import { MusicPlayerProvider } from "./hooks/useMusicPlayer";
import { SettingsProvider } from "./hooks/useSettings";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { Letters } from "./pages/Letters";
import { Memories } from "./pages/Memories";
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

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.div
          key="landing"
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
        >
          <Landing onEnter={enter} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex min-h-[100svh] flex-col bg-mist"
        >
          <Navbar route={route} onNavigate={navigate} />

          <main className="flex-1 pt-16">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {route === "dashboard" && <Dashboard onNavigate={navigate} />}
              {route === "letters" && <Letters />}
              {route === "memories" && <Memories />}
              {route === "playlist" && <Playlist />}
              {route === "settings" && <Settings />}
            </motion.div>
          </main>

          <Footer />
          <div aria-hidden="true" className="h-16" />
          <MiniPlayer onOpenPlaylist={() => navigate("playlist")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <MusicPlayerProvider>
          <Experience />
        </MusicPlayerProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}
