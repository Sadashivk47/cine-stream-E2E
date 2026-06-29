import mongoose, { Schema, Document } from "mongoose";

export interface IMovieItem {
  id: string;
  title: string;
  year: number;
  type: "movie" | "tv";
  duration?: string;
  episodes?: string;
  genres: string[];
  rating: number;
  description: string;
  posterUrl: string;
  bgUrl?: string;
  isFeatured?: boolean;
  isCustom?: boolean;
}

export interface IUser extends Document {
  username: string;
  password?: string; // Hashed password
  favorites: IMovieItem[];
  createdAt: Date;
}

const MovieItemSchema = new Schema<IMovieItem>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ["movie", "tv"], default: "movie" },
  duration: { type: String },
  episodes: { type: String },
  genres: [{ type: String }],
  rating: { type: Number, default: 7.5 },
  description: { type: String },
  posterUrl: { type: String },
  bgUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true, trim: true },
  password: { type: String, required: true },
  favorites: [MovieItemSchema],
  createdAt: { type: Date, default: Date.now }
}, { collection: "favorite_movies" });

if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema, "favorite_movies");
