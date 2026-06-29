import mongoose, { Schema, Document } from "mongoose";

export interface ICustomMovie extends Document {
  title: string;
  year: number;
  type: "movie" | "tv";
  genres: string[];
  rating: number;
  description: string;
  posterUrl: string; // Cloudinary CDN URL
  createdByUsername: string;
  createdAt: Date;
}

const CustomMovieSchema = new Schema<ICustomMovie>({
  title: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ["movie", "tv"], default: "movie" },
  genres: [{ type: String }],
  rating: { type: Number, default: 8.0 },
  description: { type: String, required: true },
  posterUrl: { type: String, required: true }, // Returned Cloudinary URL string
  createdByUsername: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export const CustomMovieModel = mongoose.models.CustomMovie || mongoose.model<ICustomMovie>("CustomMovie", CustomMovieSchema);
