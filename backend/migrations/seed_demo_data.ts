/**
 * Cine-Stream QA Seed Script [Instant Demo Readiness]
 * Track B: Fullstack System Integration
 * 
 * Pre-loads 2 demo users (sadashiv & cineware_admin) ready for instant evaluation.
 * Includes pre-populated favorites and custom uploaded movies.
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { CustomMovieModel } from "../models/CustomMovie";
import { mockDatabaseStore, isUsingMockDb } from "../config/db";

export async function seedDatabase(): Promise<boolean> {
  console.log("-> [Seed Script]: Initializing QA Demo Pre-Seeding...");

  const salt = await bcrypt.genSalt(10);
  const hashedPass1 = await bcrypt.hash("demo123", salt);
  const hashedPass2 = await bcrypt.hash("admin123", salt);

  const sampleFavoritesUser1 = [
    {
      id: "midnight-reckoning",
      title: "Midnight Reckoning",
      year: 2024,
      type: "movie" as const,
      duration: "2h 14m",
      genres: ["Noir", "Action", "Crime"],
      rating: 8.9,
      description: "A disgraced detective uncovers a labyrinth of betrayal in a perpetual rain-slicked metropolis.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80",
      bgUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      isFeatured: true
    },
    {
      id: "neon-genesis-tokyo",
      title: "Neon Genesis: Tokyo",
      year: 2025,
      type: "movie" as const,
      duration: "1h 58m",
      genres: ["Sci-Fi", "Cyberpunk", "Thriller"],
      rating: 9.1,
      description: "In 2099, rogue synthetic androids seek emotional autonomy amidst skyscraper neon lights.",
      posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
      bgUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80"
    }
  ];

  const sampleFavoritesUser2 = [
    {
      id: "the-red-beyond",
      title: "The Red Beyond",
      year: 2023,
      type: "movie" as const,
      duration: "2h 35m",
      genres: ["Sci-Fi", "Adventure", "Drama"],
      rating: 9.3,
      description: "An isolated crew aboard a deep-space station encounters an inexplicable gravitational anomaly.",
      posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80",
      bgUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80"
    }
  ];

  const sampleCustomMovies = [
    {
      _id: "60c72b2f9b1d8e001c8c221a",
      title: "Cyber City Odyssey",
      year: 2026,
      type: "movie" as const,
      genres: ["Sci-Fi", "Action"],
      rating: 8.5,
      description: "An uploaded QA asset demonstrating Phase 3 Multer + FormData streaming pipeline.",
      posterUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
      createdByUsername: "sadashiv",
      createdAt: new Date()
    }
  ];

  if (isUsingMockDb) {
    mockDatabaseStore.users.set("sadashiv", {
      _id: "user-demo-1",
      username: "sadashiv",
      password: hashedPass1,
      favorites: sampleFavoritesUser1
    });
    mockDatabaseStore.users.set("cineware_admin", {
      _id: "user-demo-2",
      username: "cineware_admin",
      password: hashedPass2,
      favorites: sampleFavoritesUser2
    });

    sampleCustomMovies.forEach(cm => {
      mockDatabaseStore.customMovies.set(cm._id, cm);
    });

    console.log("-> [Seed Script]: Pre-seeded 2 Demo Users (sadashiv / cineware_admin) in In-Memory Store.");
    return true;
  }

  // If connected to Atlas real database:
  try {
    await UserModel.deleteMany({ username: { $in: ["sadashiv", "cineware_admin"] } });
    await UserModel.create([
      { username: "sadashiv", password: hashedPass1, favorites: sampleFavoritesUser1 },
      { username: "cineware_admin", password: hashedPass2, favorites: sampleFavoritesUser2 }
    ]);

    let objectIdToRemove: any = null;
    try {
      objectIdToRemove = new mongoose.Types.ObjectId("60c72b2f9b1d8e001c8c221a");
    } catch (e) {
      // ignore
    }

    await CustomMovieModel.deleteMany({
      $or: [
        { _id: "60c72b2f9b1d8e001c8c221a" },
        ...(objectIdToRemove ? [{ _id: objectIdToRemove }] : []),
        { title: "Cyber City Odyssey" },
        { createdByUsername: "sadashiv" },
        { createdByUsername: "nakul_demo" }
      ]
    });
    await CustomMovieModel.create(sampleCustomMovies);

    console.log("-> [Seed Script]: Pre-seeded 2 Demo Users (sadashiv / cineware_admin) into MongoDB Atlas.");
    return true;
  } catch (err: any) {
    console.error("-> [Seed Script]: Error seeding MongoDB Atlas:", err.message);
    return false;
  }
}
