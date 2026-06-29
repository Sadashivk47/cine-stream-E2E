import React, { useEffect, useState, useRef } from "react";
import { getPopularMovies, searchMovies } from "../api/tmdb";
import { getMovieSuggestionFromMood } from "../api/ai";
import type { Movie } from "../types/movie";
import MovieCard, { SkeletonCard } from "../components/MovieCard";
import "../styles/home.css";
import useDebounce from "../hooks/useDebounce";

import { 
  Play, 
  Search, 
  Heart, 
  Sparkles, 
  Film, 
  Tv, 
  RotateCcw, 
  Compass, 
  Flame, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getSpotlightVideoId = (movie: Movie): string => {
  const map: Record<string, string> = {
    'midnight-reckoning': 'u48_JpUloGY', // Spider-Noir
    'neon-genesis-tokyo': 'gCcx85zly3I', // Blade Runner 2049
    'the-red-beyond': 'zSWdZAIB3nY', // Interstellar
    'midnight-jazz': 'mqqft22SCOL', // The Batman
    'shadow-realm': 'U2Qp5pL38gY', // Dune Part Two
    'the-silent-echo': 'zSWdZAIB3nY',
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
  return movie.id && map[movie.id] ? map[movie.id] : 'u48_JpUloGY';
};

interface HomeProps {
  key?: React.Key | string | number;
  favorites: Movie[];
  onFavoriteToggle: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  watchlist: Movie[];
  onWatchTrailer: (movie: Movie) => void;
  isTMDBActive: boolean;
  setIsTMDBActive: (active: boolean) => void;
}

export default function Home({
  favorites,
  onFavoriteToggle,
  onWatchlistToggle,
  watchlist,
  onWatchTrailer,
  isTMDBActive,
  setIsTMDBActive
}: HomeProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [moodQuery, setMoodQuery] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedMovie: Movie;
    aiExplanation: string;
    isKeyLeaked?: boolean;
    apiError?: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 500);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedType, setSelectedType] = useState("all"); // "all" | "movie" | "tv"
  const [hasMore, setHasMore] = useState(true);

  const [videoOpacity, setVideoOpacity] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const playerRef = useRef<any>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightTrailerId, setSpotlightTrailerId] = useState("");

  const spotlightMovie = movies[spotlightIndex] || movies[0] || null;
  const bgVideoId = spotlightTrailerId;

  // Retrieve dynamic YouTube trailer ID from server for the active spotlight target
  useEffect(() => {
    if (!spotlightMovie || !spotlightMovie.id) return;

    // Reset video opacity, loaded state, and clear active background ID immediately on theme switch
    setVideoOpacity(0);
    setIsVideoLoaded(false);
    setSpotlightTrailerId("");

    let active = true;
    fetch(`/api/movies/${spotlightMovie.id}/trailer`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response is not JSON");
        }
        return res.json();
      })
      .then(data => {
        if (active && data && data.videoId) {
          setSpotlightTrailerId(data.videoId);
        }
      })
      .catch(err => {
        console.error("Cine-Stream: Failed to load spotlight movie trailer ID:", err);
        if (active) setSpotlightTrailerId("u48_JpUloGY");
      });

    return () => {
      active = false;
    };
  }, [spotlightMovie?.id]);

  // Slideshow rotation cycle: switches spotlight index every 25 seconds
  useEffect(() => {
    if (movies.length <= 1) return;

    const interval = setInterval(() => {
      setSpotlightIndex(prev => {
        const nextIndex = prev + 1;
        const limit = Math.min(6, movies.length); // Rotate among the top 6 hot visual releases
        return nextIndex >= limit ? 0 : nextIndex;
      });
    }, 25000);

    return () => clearInterval(interval);
  }, [movies.length]);

  // Dynamic load of YouTube API if not present and start-stop timer lifecycle
  useEffect(() => {
    if (!bgVideoId) return;

    // Reset visibility states initially
    setIsVideoLoaded(false);
    setVideoOpacity(0);

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any = null;
    let isActive = true;

    const initPlayer = () => {
      if (!isActive || !(window as any).YT || !(window as any).YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      // Check if the DOM placeholder element exists
      const container = document.getElementById("spotlight-yt-container");
      if (!container) return;

      player = new (window as any).YT.Player("spotlight-yt-container", {
        videoId: bgVideoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 0,
          playlist: bgVideoId,
          showinfo: 0,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
          vq: "hd1080", // Keep video at highest 1080p/720p HD crystal resolution
        },
        events: {
          onReady: (event: any) => {
            if (!isActive) return;
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (!isActive) return;

            // State 1 is PLAYING
            if (event.data === 1) {
              // Slowly fade in video screen once active streaming starts (wait 5.0s to bypass loading/UI overlays like Play/Pause)
              setTimeout(() => {
                if (isActive) {
                  setVideoOpacity(1);
                  setIsVideoLoaded(true);
                }
              }, 5000);

              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
              }

              // Check video current positions against duration and half mark
              checkIntervalRef.current = setInterval(() => {
                if (!isActive || !player) return;
                try {
                  const duration = player.getDuration();
                  const currentTime = player.getCurrentTime();

                  if (duration > 0) {
                    const halfPoint = duration * 0.5;
                    const safetyCutoffPoint = duration - 2.0;

                    // Pause halfway through playing OR near YouTube endscreen trigger
                    if (currentTime >= halfPoint || currentTime >= safetyCutoffPoint) {
                      player.pauseVideo();
                      setVideoOpacity(0); // Fade back out to clear poster!
                      if (checkIntervalRef.current) {
                        clearInterval(checkIntervalRef.current);
                      }
                    }
                  }
                } catch (e) {}
              }, 400);
            }
          },
        },
      });

      playerRef.current = player;
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const poll = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(poll);
          initPlayer();
        }
      }, 200);

      const prevReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        clearInterval(poll);
        initPlayer();
      };
    }

    return () => {
      isActive = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
          playerRef.current = null;
      }
    };
  }, [bgVideoId]);

  // Reset pagination state and spotlight index when filters or searches mutate
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
    setSpotlightIndex(0);
  }, [debouncedQuery, selectedGenre, selectedType]);

  // Core data fetching logic
  const fetchData = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (debouncedQuery) {
        data = await searchMovies(debouncedQuery, pageNum, selectedGenre, selectedType);
      } else {
        data = await getPopularMovies(pageNum, selectedGenre, selectedType);
      }

      setIsTMDBActive(!!data.isTMDB);

      if (pageNum === 1) {
        setMovies(data.movies || []);
      } else {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const union = [...prev];
          (data.movies || []).forEach((m: Movie) => {
            if (!existingIds.has(m.id)) {
              union.push(m);
            }
          });
          return union;
        });
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      console.error("Discovery Engine error:", err);
      // Fail gracefully and use local fallback if TMDB is down
      setError(err?.message || "Failed to fetch film updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, debouncedQuery, selectedGenre, selectedType]);

  // Infinite Scroll IntersectionObserver configuration
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreRef.current, hasMore, loading]);

  const submitMoodFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodQuery.trim() || isAILoading) return;

    setIsAILoading(true);
    setError(null);
    setAiSuggestion(null);

    try {
      const data = await getMovieSuggestionFromMood(moodQuery);
      setAiSuggestion(data);
    } catch (err: any) {
      setError(err?.message || "Oracle suggestion is temporarily offline.");
    } finally {
      setIsAILoading(false);
    }
  };

  const genresList = [
    "All",
    "Sci-Fi",
    "Cyberpunk",
    "Action",
    "Drama",
    "Thriller",
    "Mystery",
    "Horror",
    "Adventure"
  ];

  return (
    <div className="w-full">
      {/* Spotlight Core Landscape Hero Header starting from absolute topmost screen */}
      {spotlightMovie && (() => {
        return (
          <section className="relative w-full h-[85vh] sm:h-[90vh] lg:h-[98vh] flex items-end overflow-hidden pb-4 sm:pb-6 pt-36 sm:pt-44">
            <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
              
              {/* Clear un-darkened high resolution background movie poster image beneath video */}
              <img
                src={spotlightMovie.bgUrl || spotlightMovie.posterUrl}
                alt={spotlightMovie.title}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] brightness-100 ${
                  videoOpacity === 1 ? "opacity-0" : "opacity-100"
                }`}
              />

              {/* Dynamic YouTube container managed by the timer script */}
              <div 
                className="absolute inset-0 w-full h-full transition-opacity duration-[1500ms] ease-in-out" 
                style={{ opacity: videoOpacity }}
              >
                <div id="spotlight-yt-container" className="w-full h-full pointer-events-none absolute" style={{
                  width: '100vw',
                  height: '56.25vw', /* maintains 16:9 ratio */
                  minHeight: '100vh',
                  minWidth: '177.77vh', /* maintains 16:9 ratio */
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scale(1.15)',
                }} />
              </div>
            </div>

            {/* Completely transparent background card shifted down and to the leftmost screen limits */}
            <div className="relative w-full px-2 sm:px-4 md:px-6">
              <div className="max-w-2xl flex flex-col items-start gap-3 bg-transparent p-0 rounded-none border-0 shadow-none backdrop-blur-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-extrabold tracking-widest text-crimson-400 uppercase bg-black/60 rounded-full border border-crimson-800/80 drop-shadow">
                  <Flame className="w-3 h-3 animate-pulse" />
                  SPOTLIGHT RECORD
                </span>

                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                  {spotlightMovie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono text-gray-200 mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-white font-bold border border-noir-700">4K ULTRA HD</span>
                  <span>{spotlightMovie.year}</span>
                  {spotlightMovie.duration && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      <span>{spotlightMovie.duration}</span>
                    </>
                  )}
                  {spotlightMovie.episodes && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      <span>{spotlightMovie.episodes}</span>
                    </>
                  )}
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <span className="text-amber-400 font-bold">★ {spotlightMovie.rating} SCORE</span>
                </div>

                <p className="text-gray-100 text-sm sm:text-base leading-relaxed line-clamp-3 md:line-clamp-none max-w-xl font-medium drop-shadow-[0_3px_10px_rgba(0,0,0,1)]">
                  {spotlightMovie.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 w-full mt-4 font-display">
                  <button 
                    onClick={() => onWatchTrailer(spotlightMovie)}
                    className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-crimson-500 text-white flex items-center gap-2 hover:bg-crimson-450 hover:scale-[1.02] active:scale-98 transition shadow-[0_4px_25px_rgba(220,13,28,0.4)] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Trailer
                  </button>
                  
                  <button
                    onClick={() => onWatchlistToggle(spotlightMovie)}
                    className={`px-4.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
                      watchlist.some(w => w.id === spotlightMovie.id)
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-905"
                        : "bg-black/70 text-white border border-noir-700 hover:bg-noir-900"
                    }`}
                  >
                    {watchlist.some(w => w.id === spotlightMovie.id) ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {watchlist.some(w => w.id === spotlightMovie.id) ? "On Watchlist" : "Add to Favorites List"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* AI Mood Matcher Segment (AI-to-TMDB integration) */}
      <section className="w-full px-2 sm:px-4 md:px-6 py-6">
        <div className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-noir-900 via-noir-850 to-noir-900 border border-noir-800 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="absolute right-0 top-0 w-80 h-80 bg-crimson-500/5 rounded-full blur-[100px] pointer-events-none select-none" />
          <div className="absolute left-1/4 bottom-0 w-60 h-60 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none select-none" />

          <div className="relative flex flex-col lg:flex-row items-stretch gap-8">
            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2 text-crimson-400 font-display text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Smart Recommendations
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                AI Recommendation Search
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                Describe the kind of film you are looking for (e.g., <em>&ldquo;a cozy, heartwarming drama about family on a rainy day&rdquo;</em> or <em>&ldquo;a suspenseful neon cyberpunk thriller&rdquo;</em>), and let AI recommend the perfect watch.
              </p>

              <form onSubmit={submitMoodFilter} className="flex flex-col sm:flex-row gap-3 mt-3 w-full max-w-lg">
                <input
                  type="text"
                  value={moodQuery}
                  onChange={(e) => setMoodQuery(e.target.value)}
                  placeholder="What are you in the mood for? (e.g., 'Retro sci-fi mystery')"
                  className="flex-1 bg-noir-950 text-white text-sm rounded-xl px-4 py-3.5 border border-noir-700 focus:outline-none focus:border-crimson-500 placeholder:text-gray-600 focus:ring-1 focus:ring-crimson-500/50 transition-all font-display"
                />
                <button
                  type="submit"
                  disabled={isAILoading || !moodQuery.trim()}
                  className="px-5 py-3.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-crimson-600 to-purple-700 hover:from-crimson-500 hover:to-purple-600 disabled:opacity-50 disabled:pointer-events-none transition duration-200 active:scale-98 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(180,6,18,0.3)] min-w-[125px] cursor-pointer"
                >
                  {isAILoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Find Film
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg max-w-lg">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  {error}
                </div>
              )}

              {aiSuggestion?.isKeyLeaked && (
                <div className="mt-3 text-amber-400 text-xs flex items-start gap-2 bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl max-w-lg">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <span className="font-extrabold block text-amber-300 uppercase text-[10px] tracking-wider mb-0.5">Gemini Access Restricted</span>
                    Your configured <code>GEMINI_API_KEY</code> appears to be reported as leaked or is invalid. Mood matching has fallen back to local rules. Please go to your Google AI Studio Settings to rotate your API key.
                  </div>
                </div>
              )}
            </div>

            {/* Result panel */}
            <div className="lg:w-96 shrink-0 flex items-stretch">
              <AnimatePresence mode="wait">
                {aiSuggestion ? (
                  <motion.div
                    key="matcher-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-noir-950/70 backdrop-blur border border-noir-700/80 rounded-xl p-5 flex flex-col gap-4 relative"
                  >
                    <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-rose-500 text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow">
                      ★ AI Recommended Match
                    </span>

                    <div className="flex gap-4 items-center">
                      {aiSuggestion.suggestedMovie.posterUrl ? (
                        <img
                          src={aiSuggestion.suggestedMovie.posterUrl}
                          alt={aiSuggestion.suggestedMovie.title}
                          className="w-16 h-24 object-cover rounded-lg border border-noir-700 shadow"
                        />
                      ) : (
                        <div className="w-16 h-24 rounded-lg bg-noir-900 border border-noir-800 flex flex-col items-center justify-center text-center p-1 text-[8px] text-gray-500">
                          <Film className="w-4 h-4 text-gray-600 mb-1" />
                          NO COVER
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-display font-black text-white text-base leading-tight">
                          {aiSuggestion.suggestedMovie.title}
                        </h4>
                        <span className="text-xs font-mono text-crimson-400 block mt-1">
                          {aiSuggestion.suggestedMovie.genres.join(" • ")}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {aiSuggestion.suggestedMovie.year} 
                          {aiSuggestion.suggestedMovie.duration && ` • ${aiSuggestion.suggestedMovie.duration}`}
                          {aiSuggestion.suggestedMovie.episodes && ` • ${aiSuggestion.suggestedMovie.episodes}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 text-xs text-gray-300 italic font-medium bg-noir-900/80 p-3.5 rounded-lg border border-noir-800 leading-relaxed font-display">
                      &ldquo;{aiSuggestion.aiExplanation}&rdquo;
                    </div>

                    {aiSuggestion.isKeyLeaked && (
                      <div className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg flex items-start gap-1.5 leading-tight">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                        <div>
                          Fallen back to local rules because the API key is reported as leaked.
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={onWatchTrailer}
                        className="flex-1 py-2 rounded-lg bg-crimson-500 hover:bg-crimson-400 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Watch Now
                      </button>
                      <button
                        onClick={() => onFavoriteToggle(aiSuggestion.suggestedMovie)}
                        className={`px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          favorites.some(fav => fav.id === aiSuggestion.suggestedMovie.id)
                            ? "bg-noir-900 text-crimson-500 border-crimson-500/35"
                            : "bg-noir-900 hover:bg-noir-800 text-gray-300 border-noir-700"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.some(fav => fav.id === aiSuggestion.suggestedMovie.id) ? "fill-crimson-500 text-crimson-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => {
                          setAiSuggestion(null);
                          setMoodQuery("");
                        }}
                        className="py-2 px-2.5 rounded-lg bg-noir-900 text-gray-400 hover:text-white border border-noir-800 text-xs text-center cursor-pointer"
                        title="Reset Matcher"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full h-full min-h-[160px] border border-dashed border-noir-700 rounded-xl flex flex-col items-center justify-center p-6 text-center text-gray-500 bg-noir-950/30">
                    {isAILoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-crimson-500/20 border-t-crimson-500 rounded-full animate-spin" />
                        <span className="text-xs text-gray-400 select-none animate-pulse">Finding your movie match...</span>
                      </div>
                    ) : (
                      <>
                        <Compass className="w-8 h-8 text-noir-700 mb-2" />
                        <p className="text-sm font-semibold text-gray-400">Search standby</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed mx-auto">Describe your mood on the left to get a recommended film</p>
                      </>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 🔍 Discovery Browsing Hub Section */}
      <section id="discovery-search-section" className="w-full px-2 sm:px-4 md:px-6 py-4 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-noir-900/60 p-4 rounded-xl border border-noir-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Content type switches */}
            <div className="flex items-center bg-noir-950 p-1 rounded-lg border border-noir-800">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  selectedType === "all" ? "bg-noir-800 text-white font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                All
              </button>
              <button
                onClick={() => setSelectedType("movie")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  selectedType === "movie" ? "bg-noir-800 text-white font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Movies
              </button>
              <button
                onClick={() => setSelectedType("tv")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  selectedType === "tv" ? "bg-noir-800 text-white font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                TV Shows
              </button>
            </div>
          </div>

          {/* Debounced Search input */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movie directories..."
              className="w-full bg-noir-950 text-white rounded-xl pl-10 pr-4 py-3 text-sm border border-noir-800 focus:outline-none focus:border-crimson-500 focus:ring-1 focus:ring-crimson-500/50 placeholder:text-gray-600 transition"
              id="input-search"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-mono font-bold cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          {genresList.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-2 shrink-0 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedGenre === g
                  ? "bg-crimson-500 text-white shadow-[0_3px_12px_rgba(220,13,28,0.3)] font-black"
                  : "bg-noir-900 border border-noir-800 text-gray-400 hover:text-white hover:bg-noir-800"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Grid List Title */}
        <div className="flex items-end justify-between border-b border-noir-800 pb-2.5">
          <span className="font-display font-black text-xl text-white tracking-tight uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-crimson-500" />
            {query ? `Search results for "${query}"` : selectedGenre !== "All" ? `${selectedGenre} Showcase` : "Trending Discoveries"}
          </span>
          <span className="text-xs font-mono text-gray-500">
            {movies.length} Results Rendered
          </span>
        </div>

        {/* Main Movies Grid - Uses native lazy loading */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8 mt-2" id="movie-grid">
            {movies.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                isFavorite={favorites.some(fav => fav.id === m.id)}
                onFavoriteToggle={onFavoriteToggle}
                onWatchlistToggle={onWatchlistToggle}
                isOnWatchlist={watchlist.some(w => w.id === m.id)}
                onWatchTrailer={onWatchTrailer}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="w-full py-16 text-center border border-dashed border-noir-800 rounded-2xl flex flex-col items-center justify-center p-6 bg-noir-900/30">
            <Film className="w-12 h-12 text-noir-700 mb-3 animate-pulse" />
            <h3 className="font-display font-extrabold text-lg text-white">No Movies Found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1 leading-relaxed">
              Our projectionist turned the archive upside down, but no titles match your active filters. Try searching for something else!
            </p>
            <button 
              onClick={() => {
                setQuery("");
                setSelectedGenre("All");
                setSelectedType("all");
              }}
              className="mt-4 px-4 py-2 bg-noir-800 hover:bg-noir-700 text-white font-bold text-xs rounded-lg border border-noir-700 transition cursor-pointer"
            >
              Reset Active Filters
            </button>
          </div>
        ) : null}

        {/* Loading Grid/shimmer indicator */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 sm:gap-x-5 gap-y-8 mt-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {/* IntersectionObserver bottom element target */}
        <div ref={loadMoreRef} className="w-full h-10 mt-6 flex items-center justify-center bg-transparent">
          {hasMore && !loading && (
            <span className="text-xs font-mono text-gray-600 animate-pulse select-none">APPROACHING EVENT HORIZON</span>
          )}
        </div>
      </section>
    </div>
  );
}
