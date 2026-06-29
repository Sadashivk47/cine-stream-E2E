import React, { useState } from "react";
import { X, Lock, User, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id: string; username: string; favorites: any[] }) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const url = isSignUp ? "/api/auth/signup" : "/api/auth/login";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user);
        resetForm();
        onClose();
      } else {
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch (err: any) {
      setError("Server connection failed. Please check if backend is active.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-noir-900 border border-noir-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Top Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-crimson-600 to-rose-500" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-noir-950/40 hover:bg-noir-800 border border-noir-800 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo/Icon Area */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="w-12 h-12 bg-crimson-950/80 border border-crimson-900/40 rounded-xl flex items-center justify-center text-crimson-500 mb-3 shadow-[0_0_15px_rgba(220,13,28,0.15)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-xl text-white tracking-wide uppercase">
                {isSignUp ? "Create Account" : "Access Database"}
              </h2>
              <p className="text-gray-500 text-xs font-medium mt-1">
                {isSignUp
                  ? "Register to preserve custom discovery lists and favorite movies."
                  : "Sign in to resume persistent movie curation."}
              </p>
            </div>

            {/* Error Message Area */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-crimson-950/20 border border-crimson-900/30 text-crimson-400 text-xs py-3 px-4 rounded-xl mb-4 text-center font-medium font-mono"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login/Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none transition-all font-sans"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none transition-all font-sans"
                    disabled={isLoading}
                    required
                    minLength={4}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-crimson-600 hover:bg-crimson-500 disabled:bg-crimson-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Toggle Signin/Signup Link */}
            <div className="mt-6 text-center text-xs font-mono">
              <span className="text-gray-500">
                {isSignUp ? "Already registered?" : "Don't have an account?"}
              </span>{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                disabled={isLoading}
                className="text-crimson-500 hover:text-crimson-400 hover:underline font-bold transition ml-1 cursor-pointer bg-transparent border-0"
              >
                {isSignUp ? "Access Database" : "Create Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
