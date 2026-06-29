import React, { useState, useRef } from "react";
import { X, Upload, Film, FileImage, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Movie } from "../types/movie";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; username: string } | null;
  onUploadSuccess: (newMovie: Movie) => void;
}

export default function UploadModal({ isOpen, onClose, currentUser, onUploadSuccess }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [genres, setGenres] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelection(file);
      } else {
        setError("Please upload an image file (PNG/JPG/WEBP).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setThumbnail(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnail(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setYear(new Date().getFullYear().toString());
    setType("movie");
    setGenres("");
    setDescription("");
    setThumbnail(null);
    setThumbnailPreview(null);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please sign in first to upload custom database assets.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("year", year);
    formData.append("type", type);
    formData.append("genre", genres.trim());
    formData.append("description", description.trim());
    formData.append("createdByUsername", currentUser.username);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const res = await fetch("/api/custom-movies/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.movie) {
        setSuccess(true);
        onUploadSuccess(data.movie);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        setError(data.error || "Failed to upload custom movie asset.");
      }
    } catch (err: any) {
      setError("Server connection failed. Could not upload film asset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal Card container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-noir-900 border border-noir-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 my-8"
          >
            {/* Top Accent bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-crimson-600 to-rose-500" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-noir-950/40 hover:bg-noir-800 border border-noir-800 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header section */}
            <div className="mb-6">
              <h2 className="font-display font-black text-xl text-white tracking-wide uppercase flex items-center gap-2">
                <Upload className="w-5 h-5 text-crimson-500" />
                Upload Custom Asset
              </h2>
              <p className="text-gray-500 text-xs font-medium mt-1 font-sans">
                Contribute custom titles into the Cine-Stream live catalogue. Uploaded assets will stream immediately in your active search matching pool.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-16 text-center flex flex-col items-center justify-center space-y-3"
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                  <h3 className="font-display font-extrabold text-lg text-white">Asset Uploaded Successfully!</h3>
                  <p className="text-gray-400 text-xs font-mono max-w-sm">
                    "{title}" has been saved into persistent catalog. Synchronizing stream data...
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Form Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
                        Title / Name
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Cyber City Odyssey"
                        className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-all font-sans"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
                          Release Year
                        </label>
                        <input
                          type="number"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          placeholder="e.g. 2026"
                          className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition-all font-mono"
                          disabled={isLoading}
                          required
                          min={1880}
                          max={2100}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
                          Medium Type
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as "movie" | "tv")}
                          className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none transition-all font-mono cursor-pointer"
                          disabled={isLoading}
                        >
                          <option value="movie">Movie</option>
                          <option value="tv">TV Series</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
                        Genres (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={genres}
                        onChange={(e) => setGenres(e.target.value)}
                        placeholder="e.g. Sci-Fi, Cyberpunk, Action"
                        className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-all font-sans"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">
                        Description / Synopsis
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide film plot synopsis..."
                        rows={4}
                        className="w-full bg-noir-950/80 border border-noir-800 focus:border-crimson-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-all font-sans resize-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Poster / Drag-Drop Image upload */}
                  <div className="flex flex-col space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block mb-0.5">
                      Poster Image Cover (Required)
                    </label>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition relative overflow-hidden select-none min-h-[220px] ${
                        isDragActive
                          ? "border-crimson-500 bg-crimson-950/5"
                          : "border-noir-800 hover:border-noir-700 bg-noir-950/30 hover:bg-noir-950/50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        disabled={isLoading}
                      />

                      {thumbnailPreview ? (
                        <>
                          {/* Selected Image Preview with Full Aspect */}
                          <img
                            src={thumbnailPreview}
                            alt="Cover Preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 bg-black/50 hover:bg-black/75 transition flex items-center justify-center gap-2 p-2 text-white">
                            <div className="bg-black/60 backdrop-blur-md border border-noir-700/60 p-2 rounded-xl flex flex-col items-center shadow-lg">
                              <FileImage className="w-5 h-5 text-crimson-400 mb-1" />
                              <span className="text-[10px] font-mono truncate max-w-[150px]">
                                {thumbnail ? thumbnail.name : "Custom File"}
                              </span>
                              <button
                                onClick={handleRemoveFile}
                                className="mt-2 px-2.5 py-1 rounded-md bg-crimson-600 hover:bg-crimson-500 text-[10px] font-bold uppercase transition"
                              >
                                Replace Image
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center p-6 text-gray-400">
                          <div className="w-12 h-12 bg-noir-900 border border-noir-800 rounded-xl flex items-center justify-center text-gray-500 mb-3 group-hover:text-white transition">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-gray-300">Drag & Drop Cover Image</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-1">or click to browse local files</span>
                          <span className="text-[9px] text-gray-600 font-mono mt-3 uppercase tracking-wider block">PNG, JPG, WEBP formats</span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="text-crimson-400 text-[10px] font-mono bg-crimson-950/10 border border-crimson-900/30 p-2.5 rounded-lg text-center font-bold">
                        {error}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-crimson-600 hover:bg-crimson-500 disabled:bg-crimson-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Streaming to CDN...
                          </>
                        ) : (
                          "Publish Movie Asset"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
