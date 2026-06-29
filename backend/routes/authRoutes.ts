import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { mockDatabaseStore, isUsingMockDb } from "../config/db";

const router = Router();

/**
 * POST /api/auth/login
 * Validates user credentials with bcrypt comparison against MongoDB or Mock Engine.
 */
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required." });
  }

  const cleanUser = String(username).trim();

  try {
    let userRecord: any = null;

    if (isUsingMockDb) {
      userRecord = mockDatabaseStore.users.get(cleanUser);
    } else {
      userRecord = await UserModel.findOne({ username: cleanUser });
    }

    if (!userRecord) {
      return res.status(401).json({ success: false, error: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid username or password." });
    }

    return res.json({
      success: true,
      user: {
        id: userRecord._id || cleanUser,
        username: userRecord.username,
        favorites: userRecord.favorites || []
      }
    });
  } catch (err: any) {
    console.error("Auth Login Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during login." });
  }
});

/**
 * POST /api/auth/signup
 * Creates a new user record with bcrypt hashed password.
 */
router.post("/signup", async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body || {};

  if (!username || !password || String(password).length < 4) {
    return res.status(400).json({ success: false, error: "Username and a password of at least 4 characters are required." });
  }

  const cleanUser = String(username).trim();

  try {
    if (isUsingMockDb) {
      if (mockDatabaseStore.users.has(cleanUser)) {
        return res.status(409).json({ success: false, error: "Username already exists." });
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const newUser = {
        _id: `user-${Date.now()}`,
        username: cleanUser,
        password: hashed,
        favorites: []
      };
      mockDatabaseStore.users.set(cleanUser, newUser);
      return res.status(201).json({
        success: true,
        user: { id: newUser._id, username: cleanUser, favorites: [] }
      });
    }

    const existing = await UserModel.findOne({ username: cleanUser });
    if (existing) {
      return res.status(409).json({ success: false, error: "Username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const created = await UserModel.create({
      username: cleanUser,
      password: hashedPassword,
      favorites: []
    });

    return res.status(201).json({
      success: true,
      user: { id: created._id, username: created.username, favorites: [] }
    });
  } catch (err: any) {
    console.error("Auth Signup Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during user registration." });
  }
});

export default router;
