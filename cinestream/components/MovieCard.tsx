import React from "react";
import { Movie } from "../types/movie";
import { Play, Heart, Plus, Check, Star, Film } from "lucide-react";
import { motion } from "motion/react";

interface MovieCardProps {
  key?: any;
  movie: Movie;
  isFavorite: boolean;
  onFavoriteToggle: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isOnWatchlist: boolean;
  onWatchTrailer: (movie: Movie) => void;
}

export default function MovieCard({
  movie,
  isFavorite,
  onFavoriteToggle,
  onWatchlistToggle,
  isOnWatchlist,
  onWatchTrailer,
}: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex flex-col bg-noir-900 border border-noir-800/60 rounded-xl overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] hover:border-noir-700/80 transition-all duration-300"
    >
      {/* Poster Image Wrapper */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-noir-950">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4 bg-noir-950">
            <Film className="w-10 h-10 text-noir-800 mb-2" />
            <span className="text-xs font-mono text-center">NO COVER</span>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onWatchTrailer(movie)}
              className="flex-1 bg-crimson-600 hover:bg-crimson-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Trailer
            </button>
            <button
              onClick={() => onWatchlistToggle(movie)}
              className={`p-2 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                isOnWatchlist
                  ? "bg-noir-800 border-noir-700 text-crimson-400"
                  : "bg-black/60 border-noir-700 hover:bg-noir-800 text-white"
              }`}
              title={isOnWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {isOnWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Top Floating Badge (Rating, Custom tag) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {movie.rating > 0 && (
            <div className="bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-noir-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {movie.rating.toFixed(1)}
            </div>
          )}
          {movie.isCustom && (
            <div className="bg-crimson-950/90 backdrop-blur-md text-crimson-400 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border border-crimson-900/40">
              Custom
            </div>
          )}
        </div>

        {/* Favorite Star Icon floating */}
        <button
          onClick={() => onFavoriteToggle(movie)}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer border border-noir-800/40"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-crimson-500 text-crimson-500" : "text-gray-300 hover:text-crimson-400"
            }`}
          />
        </button>
      </div>

      {/* Info Panel */}
      <div className="p-3.5 flex flex-col flex-1 bg-noir-900/65">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-display font-bold text-sm text-gray-100 group-hover:text-white transition-colors line-clamp-1">
            {movie.title}
          </h3>
          <span className="text-xs font-mono text-gray-500 shrink-0">{movie.year}</span>
        </div>

        <div className="flex gap-1.5 items-center mt-1 text-[10px] text-gray-500 font-mono">
          <span className="uppercase text-[9px] bg-noir-800 px-1.5 py-0.5 rounded text-gray-400">
            {movie.type}
          </span>
          {movie.duration && (
            <>
              <span>•</span>
              <span>{movie.duration}</span>
            </>
          )}
        </div>

        {movie.genres && movie.genres.length > 0 && (
          <p className="text-[10px] text-crimson-500/85 font-mono truncate mt-2">
            {movie.genres.join(" • ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-noir-900 border border-noir-800/40 rounded-xl overflow-hidden aspect-[2/3] w-full flex flex-col">
      <div className="flex-1 bg-noir-950/60 relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-noir-900/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 bg-noir-800 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-noir-800 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}
