import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import { Movie } from "./types/movie";
import { CURATED_MOVIES } from "./data";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getMovieTrailerUrl = (movie: Movie): string => {
  const trailerMap: Record<string, string> = {
    'midnight-reckoning': 'u48_JpUloGY', // Accurate working trailer ID provided by user
    'neon-genesis-tokyo': 'gCcx85zly3I', // Blade Runner 2049
    'the-red-beyond': 'zSWdZAIB3nY', // Interstellar
    'midnight-jazz': 'mqqft22SCOL', // The Batman style
    'shadow-realm': 'U2Qp5pL38gY', // Dune Part Two
    'the-silent-echo': 'zSWdZAIB3nY', // Interstellar style
    'neon-nights': 'gCcx85zly3I',
    'shadow-protocol': 'mqqft22SCOL',
    'the-last-nebula': 'U2Qp5pL38gY',
    'noir-chronicles': 'mqqft22SCOL',
    'binary-horizon': 'gCcx85zly3I',
    'neon-requiem': 'gCcx85zly3I',
    'the-last-drive': 'mqqft22SCOL',
    'neon-district': 'gCcx85zly3I',
    'inner-space': 'zSWdZAIB3nY',
    'the-red-cabin': 'U2Qp5pL38gY',
    'room-404': 'mqqft22SCOL',
    'midnight-orbit': 'zSWdZAIB3nY',
    'neon-syndicate': 'gCcx85zly3I',
    'binary-pulse': 'gCcx85zly3I',
    'the-final-act': 'mqqft22SCOL',
    'horizon-bound': 'zSWdZAIB3nY',
    'urban-jungle-last-city': 'gCcx85zly3I',
    'kingdom-fall': 'U2Qp5pL38gY'
  };

  const mapped = movie.id ? trailerMap[movie.id] : null;
  if (mapped) {
    return `https://www.youtube.com/embed/${mapped}?autoplay=1&mute=0&rel=0&modestbranding=1`;
  }

  // Fallback to the premium, verified trailer to ensure it never says 'Video Unavailable'
  return `https://www.youtube.com/embed/u48_JpUloGY?autoplay=1&mute=0&rel=0&modestbranding=1`;
};

export default function App() {
  // Track B Fullstack Auth & Modal States
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: "tab" | "favorite"; target?: any } | null>(null);

  // Navigation & Route states
  const [activeTab, setActiveTab] = useState<"discover" | "favorites">("discover");
  
  // High-fidelity state persistence
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [videoOverlayUrl, setVideoOverlayUrl] = useState<string | null>(null);
  const [isTMDBActive, setIsTMDBActive] = useState<boolean>(false);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState<boolean>(false);

  // Sync state route URL back and forth for robust page loads / browser back/forward
  useEffect(() => {
    // Establish Home page (discover) on initial loading
    setActiveTab("discover");
    try {
      if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
        window.history.replaceState(null, "", "/");
      }
      if (window.location.hash) {
        window.history.replaceState(null, "", "/");
      }
    } catch (e) {
      console.warn("Could not modify routing state history: ", e);
    }

    const handleNavigationSync = () => {
      if (window.location.pathname === "/favorites" || window.location.pathname.endsWith("/favorites") || window.location.hash === "#favorites") {
        setActiveTab("favorites");
      } else {
        setActiveTab("discover");
      }
    };

    window.addEventListener("popstate", handleNavigationSync);
    window.addEventListener("hashchange", handleNavigationSync);

    return () => {
      window.removeEventListener("popstate", handleNavigationSync);
      window.removeEventListener("hashchange", handleNavigationSync);
    };
  }, []);

  const handleTabTransition = (tab: "discover" | "favorites") => {
    if (tab === "favorites" && !currentUser) {
      setPendingAction({ type: "tab", target: "favorites" });
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
    if (tab === "favorites") {
      window.history.pushState(null, "", "/favorites");
      if (currentUser) {
        setIsFavoritesLoading(true);
        fetch(`/api/users/${encodeURIComponent(currentUser.username)}/favorites`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.favorites)) {
              setFavorites(data.favorites);
            }
          })
          .catch(err => console.warn("Could not sync MongoDB favorites on tab change:", err))
          .finally(() => {
            setTimeout(() => {
              setIsFavoritesLoading(false);
            }, 600);
          });
      }
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  // Hydrate user and favorites from localStorage / MongoDB on boot
  useEffect(() => {
    const storedUser = localStorage.getItem("cinestream_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        // Phase 1: Fetch user's saved favorites from local Node.js endpoint
        setIsFavoritesLoading(true);
        fetch(`/api/users/${encodeURIComponent(parsed.username)}/favorites`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.favorites)) {
              setFavorites(data.favorites);
            }
          })
          .catch(err => console.warn("Could not sync MongoDB favorites on boot:", err))
          .finally(() => {
            setIsFavoritesLoading(false);
          });
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    } else {
      const storedFavsPayloads = localStorage.getItem("cinestream_favs_payloads");
      if (storedFavsPayloads) {
        try {
          setFavorites(JSON.parse(storedFavsPayloads));
        } catch (e) {
          console.error("Failed to parse favorites payloads", e);
        }
      } else {
        const legacyFavIds = localStorage.getItem("cinestream_favs");
        if (legacyFavIds) {
          try {
            const ids: string[] = JSON.parse(legacyFavIds);
            const matched = CURATED_MOVIES.filter(m => ids.includes(m.id));
            setFavorites(matched);
          } catch (e) {
            console.error("Failed to parse legacy fav ids", e);
          }
        }
      }
    }

    const storedWatchlistPayloads = localStorage.getItem("cinestream_watchlist_payloads");
    if (storedWatchlistPayloads) {
      try {
        setWatchlist(JSON.parse(storedWatchlistPayloads));
      } catch (e) {
        console.error("Failed to parse watchlist payloads", e);
      }
    } else {
      const legacyWatchIds = localStorage.getItem("cinestream_watchlist");
      if (legacyWatchIds) {
        try {
          const ids: string[] = JSON.parse(legacyWatchIds);
          const matched = CURATED_MOVIES.filter(m => ids.includes(m.id));
          setWatchlist(matched);
        } catch (e) {
          console.error("Failed to parse legacy watch ids", e);
        }
      }
    }
  }, []);

  const handleLoginSuccess = (user: { id: string; username: string; favorites: any[] }) => {
    const userMinimal = { id: user.id, username: user.username };
    setCurrentUser(userMinimal);
    localStorage.setItem("cinestream_user", JSON.stringify(userMinimal));
    
    let currentFavs = Array.isArray(user.favorites) ? user.favorites : [];

    if (pendingAction) {
      if (pendingAction.type === "tab" && pendingAction.target === "favorites") {
        setActiveTab("favorites");
        window.history.pushState(null, "", "/favorites");
      } else if (pendingAction.type === "favorite" && pendingAction.target) {
        const movie = pendingAction.target as Movie;
        if (!currentFavs.some((m: any) => m.id === movie.id)) {
          currentFavs = [...currentFavs, movie];
          fetch(`/api/users/${encodeURIComponent(user.username)}/favorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(movie)
          }).catch(err => console.error("MongoDB POST favorite failed:", err));
        }
      }
      setPendingAction(null);
    }

    setFavorites(currentFavs);
    localStorage.setItem("cinestream_favs_payloads", JSON.stringify(currentFavs));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("cinestream_user");
    // revert to local favorites
    const storedFavs = localStorage.getItem("cinestream_favs_payloads");
    if (storedFavs) {
      try { setFavorites(JSON.parse(storedFavs)); } catch {}
    }
  };

  // Phase 2: Update favorites list & dispatch POST/DELETE CRUD pipeline to MongoDB
  const toggleFavorite = (movie: Movie) => {
    if (!currentUser) {
      setPendingAction({ type: "favorite", target: movie });
      setIsAuthModalOpen(true);
      return;
    }

    let updated: Movie[];
    const isFav = favorites.some(fav => fav.id === movie.id);
    if (isFav) {
      updated = favorites.filter(fav => fav.id !== movie.id);
      if (currentUser) {
        fetch(`/api/users/${encodeURIComponent(currentUser.username)}/favorites/${encodeURIComponent(movie.id)}`, {
          method: "DELETE"
        }).catch(err => console.error("MongoDB DELETE favorite failed:", err));
      }
    } else {
      updated = [...favorites, movie];
      if (currentUser) {
        fetch(`/api/users/${encodeURIComponent(currentUser.username)}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movie)
        }).catch(err => console.error("MongoDB POST favorite failed:", err));
      }
    }
    setFavorites(updated);
    localStorage.setItem("cinestream_favs_payloads", JSON.stringify(updated));
    const legacyFavsIds = updated.map(m => m.id);
    localStorage.setItem("cinestream_favs", JSON.stringify(legacyFavsIds));
  };

  // Update watchlist with full payloads
  const toggleWatchlist = (movie: Movie) => {
    let updated: Movie[];
    if (watchlist.some(w => w.id === movie.id)) {
      updated = watchlist.filter(w => w.id !== movie.id);
    } else {
      updated = [...watchlist, movie];
    }
    setWatchlist(updated);
    localStorage.setItem("cinestream_watchlist_payloads", JSON.stringify(updated));

    // BACKWARD COMPATIBILITY SYNC
    const legacyWatchIds = updated.map(m => m.id);
    localStorage.setItem("cinestream_watchlist", JSON.stringify(legacyWatchIds));
  };

  const handleClearAllFavorites = () => {
    if (window.confirm("Are you sure you want to clear all your favorites?")) {
      setFavorites([]);
      localStorage.removeItem("cinestream_favs_payloads");
      localStorage.removeItem("cinestream_favs");
    }
  };

  const handleWatchTrailer = async (movie: Movie) => {
    try {
      if (!movie || !movie.id) {
        setVideoOverlayUrl(`https://www.youtube.com/embed/u48_JpUloGY?autoplay=1&mute=0&rel=0&modestbranding=1`);
        return;
      }
      const response = await fetch(`/api/movies/${movie.id}/trailer`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Response is not JSON");
      }
      const data = await response.json();
      if (data && data.videoId) {
        setVideoOverlayUrl(`https://www.youtube.com/embed/${data.videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`);
      } else {
        setVideoOverlayUrl(`https://www.youtube.com/embed/u48_JpUloGY?autoplay=1&mute=0&rel=0&modestbranding=1`);
      }
    } catch (err) {
      console.error("Failed to fetch trailer overlay ID:", err);
      setVideoOverlayUrl(`https://www.youtube.com/embed/u48_JpUloGY?autoplay=1&mute=0&rel=0&modestbranding=1`);
    }
  };

  return (
    <div className="min-h-screen bg-noir-950 text-gray-100 flex flex-col selection:bg-crimson-500 selection:text-white">
      {/* Glasmorphic Sticky Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabTransition}
        favoritesCount={favorites.length}
        isTMDBActive={isTMDBActive}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

       {/* Router View Switching */}
      <main className="flex-1">
        <AppRoutes
          activeTab={activeTab}
          onTabChange={handleTabTransition}
          favorites={favorites}
          onFavoriteToggle={toggleFavorite}
          onWatchlistToggle={toggleWatchlist}
          watchlist={watchlist}
          onWatchTrailer={handleWatchTrailer}
          onClearAllFavorites={handleClearAllFavorites}
          isTMDBActive={isTMDBActive}
          setIsTMDBActive={setIsTMDBActive}
          isFavoritesLoading={isFavoritesLoading}
        />
      </main>

      {/* Track B Phase 2/3 Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onUploadSuccess={(newMovie) => {
          // Add custom movie to discovery list dynamically or trigger re-render
        }}
      />

      {/* 📺 Real YouTube Video / Trailer Overlay Player */}
      <AnimatePresence>
        {videoOverlayUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-4xl bg-black rounded-2xl border border-noir-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden relative">
              {/* Close Button Panel */}
              <button
                onClick={() => setVideoOverlayUrl(null)}
                className="absolute top-3 right-3 z-30 w-10 h-10 bg-black/80 hover:bg-crimson-600 text-white rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95 cursor-pointer text-2xl font-bold shadow-lg"
                title="Close Trailer"
              >
                &times;
              </button>

              <div className="relative aspect-video bg-black">
                <iframe
                  src={videoOverlayUrl}
                  title="Movie Trailer/Teaser"
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
