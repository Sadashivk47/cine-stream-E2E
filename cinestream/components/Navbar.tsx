import React from "react";
import { Film, Upload, LogIn, LogOut, User, Search } from "lucide-react";

interface NavbarProps {
  activeTab: "discover" | "favorites";
  onTabChange: (tab: "discover" | "favorites") => void;
  favoritesCount: number;
  isTMDBActive: boolean;
  currentUser: { id: string; username: string } | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenUpload: () => void;
}

export default function Navbar({
  activeTab,
  onTabChange,
  favoritesCount,
  isTMDBActive,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenUpload,
}: NavbarProps) {
  const handleSearchClick = () => {
    onTabChange("discover");
    setTimeout(() => {
      const searchEl = document.getElementById("input-search");
      if (searchEl) {
        searchEl.scrollIntoView({ behavior: "smooth", block: "center" });
        searchEl.focus();
      }
    }, 150);
  };

  return (
    <header className="absolute top-0 left-0 w-full z-40 bg-transparent flex flex-col">
      {/* 🚀 Top Ticker Info Bar perfectly styled like the screenshot */}
      <div className="w-full bg-black py-2 px-4 border-b border-noir-900/20 text-center">
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-wide">
          Discover trending releases, curated recommendations, and cinematic gems updated daily{" "}
          <span 
            onClick={() => onTabChange("discover")}
            className="text-white font-bold hover:underline ml-1 cursor-pointer inline-flex items-center gap-1 transition"
          >
            Start Exploring &rarr;
          </span>
        </p>
      </div>

      {/* 🎬 Main Navigation Bar */}
      <div className="w-full px-6 sm:px-10 lg:px-14 h-24 flex items-center justify-between">
        {/* Left Section: Film Icon and Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Film Icon Circle */}
          <div 
            onClick={() => onTabChange("discover")}
            className="w-11 h-11 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-crimson-500 hover:bg-black/85 hover:text-crimson-400 transition cursor-pointer active:scale-95 shadow-lg"
          >
            <Film className="w-4.5 h-4.5" />
          </div>
          {/* Brand Name Capsule */}
          <div 
            onClick={() => onTabChange("discover")}
            className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full h-11 px-5 flex items-center justify-center cursor-pointer hover:bg-black/85 transition active:scale-95 shadow-lg"
          >
            <h1 className="font-display font-black text-sm text-white tracking-widest uppercase">
              Cine<span className="text-crimson-500">Stream</span>
            </h1>
          </div>
        </div>

        {/* Center Section: Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg">
          <button
            onClick={() => onTabChange("discover")}
            className={`px-5 py-2 rounded-full text-[12px] font-black tracking-widest transition cursor-pointer ${
              activeTab === "discover"
                ? "bg-crimson-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => onTabChange("favorites")}
            className={`px-5 py-2 rounded-full text-[12px] font-black tracking-widest transition cursor-pointer flex items-center gap-2 relative ${
              activeTab === "favorites"
                ? "bg-crimson-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            FAVORITES
            {favoritesCount > 0 && (
              <span className="bg-crimson-900/60 border border-crimson-700/50 text-crimson-300 text-[11px] font-mono font-black px-2 py-0.5 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Auth & Actions */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <>
              {/* Upload custom movie button */}
              <button
                onClick={onOpenUpload}
                className="bg-black/60 backdrop-blur-md hover:bg-black/85 text-gray-300 hover:text-white border border-white/10 px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95 h-11"
              >
                <Upload className="w-4 h-4 text-crimson-500" />
                <span className="hidden md:inline">Upload Asset</span>
              </button>

              {/* User Profile Info Capsule */}
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full h-11 px-4 hover:bg-black/85 transition cursor-pointer">
                <User className="w-4 h-4 text-crimson-500" />
                <span className="text-[12px] font-black text-gray-200 uppercase tracking-wide max-w-[90px] truncate">
                  {currentUser.username}
                </span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-crimson-950/40 hover:text-crimson-400 text-gray-300 border border-white/10 flex items-center justify-center transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-crimson-600 hover:bg-crimson-500 border border-white/10 text-white px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95 h-11 shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Search Button Circle matches the screenshot */}
          <button
            onClick={handleSearchClick}
            title="Search Movies"
            className="w-11 h-11 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/85 transition cursor-pointer active:scale-95 shadow-lg"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
