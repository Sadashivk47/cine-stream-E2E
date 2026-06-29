import { Router, Request, Response } from "express";
import { UserModel } from "../models/User";
import { mockDatabaseStore, isUsingMockDb } from "../config/db";
import mongoose from "mongoose";

const router = Router();

function buildUserQuery(userId: string) {
  const conds: any[] = [{ username: userId }];
  if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
    conds.push({ _id: userId });
  }
  return { $or: conds };
}

/**
 * GET /api/users/:userId/favorites
 * Fetches user's saved favorites from MongoDB or Mock Engine.
 */
router.get("/:userId/favorites", async (req: Request, res: Response): Promise<any> => {
  const userId = decodeURIComponent(req.params.userId);

  try {
    if (isUsingMockDb) {
      const user = mockDatabaseStore.users.get(userId) || Array.from(mockDatabaseStore.users.values()).find(u => u._id === userId || u.username === userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }
      return res.json({ success: true, favorites: user.favorites || [] });
    }

    const user = await UserModel.findOne(buildUserQuery(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    return res.json({ success: true, favorites: user.favorites || [] });
  } catch (err: any) {
    console.error("GET Favorites Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching favorites." });
  }
});

/**
 * POST /api/users/:userId/favorites
 * Adds a movie item to the user's favorites array in MongoDB.
 */
router.post("/:userId/favorites", async (req: Request, res: Response): Promise<any> => {
  const userId = decodeURIComponent(req.params.userId);
  const moviePayload = req.body || {};

  if (!moviePayload.id || !moviePayload.title) {
    return res.status(400).json({ success: false, error: "Valid movie object payload is required." });
  }

  try {
    if (isUsingMockDb) {
      const user = mockDatabaseStore.users.get(userId) || Array.from(mockDatabaseStore.users.values()).find(u => u._id === userId || u.username === userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }
      const existing = (user.favorites || []).some((m: any) => m.id === moviePayload.id);
      if (!existing) {
        user.favorites = [...(user.favorites || []), moviePayload];
      }
      return res.json({ success: true, favorites: user.favorites });
    }

    const user = await UserModel.findOne(buildUserQuery(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!user.favorites) user.favorites = [];
    const existing = user.favorites.some((m: any) => m.id === moviePayload.id);
    if (!existing) {
      user.favorites.push(moviePayload);
      await user.save();
    }

    return res.json({ success: true, favorites: user.favorites });
  } catch (err: any) {
    console.error("POST Favorite Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error saving favorite." });
  }
});

/**
 * DELETE /api/users/:userId/favorites/:movieId
 * Deletes a movie item from the user's favorites array in MongoDB.
 */
router.delete("/:userId/favorites/:movieId", async (req: Request, res: Response): Promise<any> => {
  const userId = decodeURIComponent(req.params.userId);
  const movieId = decodeURIComponent(req.params.movieId);

  try {
    if (isUsingMockDb) {
      const user = mockDatabaseStore.users.get(userId) || Array.from(mockDatabaseStore.users.values()).find(u => u._id === userId || u.username === userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }
      user.favorites = (user.favorites || []).filter((m: any) => m.id !== movieId);
      return res.json({ success: true, favorites: user.favorites });
    }

    const user = await UserModel.findOne(buildUserQuery(userId));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (!user.favorites) user.favorites = [];
    user.favorites = user.favorites.filter((m: any) => m.id !== movieId);
    await user.save();

    return res.json({ success: true, favorites: user.favorites });
  } catch (err: any) {
    console.error("DELETE Favorite Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error removing favorite." });
  }
});

export default router;
