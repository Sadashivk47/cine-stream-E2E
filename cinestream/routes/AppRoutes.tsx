import React from "react";
import { Movie } from "../types/movie";
import Home from "../pages/Home";
import MovieCard from "../components/MovieCard";
import { Heart, Trash2, Film, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AppRoutesProps {
  activeTab: "discover" | "favorites";
  onTabChange: (tab: "discover" | "favorites") => void;
  favorites: Movie[];
  onFavoriteToggle: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  watchlist: Movie[];
  onWatchTrailer: (movie: Movie) => void;
  onClearAllFavorites: () => void;
  isTMDBActive: boolean;
  setIsTMDBActive: (active: boolean) => void;
  isFavoritesLoading: boolean;
}

export default function AppRoutes({
  activeTab,
  onTabChange,
  favorites,
  onFavoriteToggle,
  onWatchlistToggle,
  watchlist,
  onWatchTrailer,
  onClearAllFavorites,
  isTMDBActive,
  setIsTMDBActive,
  isFavoritesLoading,
}: AppRoutesProps) {
  if (activeTab === "discover") {
    return (
      <Home
        favorites={favorites}
        onFavoriteToggle={onFavoriteToggle}
        onWatchlistToggle={onWatchlistToggle}
        watchlist={watchlist}
        onWatchTrailer={onWatchTrailer}
        isTMDBActive={isTMDBActive}
        setIsTMDBActive={setIsTMDBActive}
      />
    );
  }

  // Render "favorites" tab
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-12 sm:pt-40">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-noir-900 pb-6 mb-8">
        <div>
          <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase flex items-center gap-2">
            <Heart className="w-6 h-6 text-crimson-500 fill-crimson-500" />
            Your Cinematic Vault
          </h2>
          <p className="text-gray-500 text-xs font-mono mt-1">
            {favorites.length} saved {favorites.length === 1 ? "title" : "titles"} found in your persistent library.
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={onClearAllFavorites}
            className="self-start sm:self-auto bg-noir-900 hover:bg-crimson-950/40 text-gray-400 hover:text-crimson-400 border border-noir-800 hover:border-crimson-900/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Vault
          </button>
        )}
      </div>

      {/* Loading State or Grid rendering */}
      <AnimatePresence mode="wait">
        {isFavoritesLoading ? (
          <motion.div
            key="loading-vault"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-24 text-center flex flex-col items-center justify-center space-y-3"
          >
            <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Retrieving vault archives...</span>
          </motion.div>
        ) : favorites.length > 0 ? (
          <motion.div
            key="vault-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8"
          >
            {favorites.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                isFavorite={true}
                onFavoriteToggle={onFavoriteToggle}
                onWatchlistToggle={onWatchlistToggle}
                isOnWatchlist={watchlist.some((w) => w.id === m.id)}
                onWatchTrailer={onWatchTrailer}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-vault"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full py-24 text-center border border-dashed border-noir-800 rounded-2xl flex flex-col items-center justify-center p-6 bg-noir-900/10"
          >
            <Film className="w-12 h-12 text-noir-800 mb-3" />
            <h3 className="font-display font-extrabold text-lg text-white">Your Vault is Empty</h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto mt-1 leading-relaxed">
              No cinematic treasures saved yet. Browse our selection in the Discover catalog and tap the heart icon on any title to save it.
            </p>
            <button
              onClick={() => onTabChange("discover")}
              className="mt-6 bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg"
            >
              Start Exploring
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
