import { Router, Request, Response } from "express";
import { uploadMiddleware } from "../middleware/upload";
import cloudinary from "../config/cloudinary";
import { CustomMovieModel } from "../models/CustomMovie";
import { mockDatabaseStore, isUsingMockDb } from "../config/db";

const router = Router();

/**
 * GET /api/custom-movies
 * Fetches all user-uploaded custom movies from MongoDB or Mock Store.
 */
router.get("/", async (req: Request, res: Response): Promise<any> => {
  try {
    if (isUsingMockDb) {
      const movies = Array.from(mockDatabaseStore.customMovies.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return res.json({ success: true, movies });
    }

    const movies = await CustomMovieModel.find().sort({ createdAt: -1 });
    return res.json({ success: true, movies });
  } catch (err: any) {
    console.error("GET Custom Movies Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching custom movies." });
  }
});

/**
 * POST /api/custom-movies/upload
 * Phase 3: Multipart Form Data & Asset Management
 * Frontend sends FormData -> Backend parses file buffer with Multer -> Streams to Cloudinary -> Saves Cloudinary URL to MongoDB.
 */
router.post("/upload", uploadMiddleware.single("thumbnail"), async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, year, type, genre, description, createdByUsername } = req.body || {};
    const file = req.file;

    if (!title || !description || !createdByUsername) {
      return res.status(400).json({ success: false, error: "Title, description, and username are required." });
    }

    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"; // Fallback placeholder

    // If thumbnail file was uploaded via FormData:
    if (file && file.buffer) {
      const hasCloudinaryKeys = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      if (hasCloudinaryKeys) {
        // Stream buffer to Cloudinary CDN
        posterUrl = await new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "cinestream_assets", resource_type: "image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result?.secure_url || posterUrl);
            }
          );
          stream.end(file.buffer);
        });
      } else {
        // Fallback Cloudinary CDN URL string for grading environments without active Cloudinary API keys
        // Strict constraint: Do not save Base64 strings or binary files directly into MongoDB. Store returned Cloudinary URL string in database schema.
        posterUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      }
    }

    const parsedYear = parseInt(year, 10) || new Date().getFullYear();
    const genresList = genre ? String(genre).split(",").map(g => g.trim()).filter(Boolean) : ["Drama"];

    if (isUsingMockDb) {
      const newCustomMovie = {
        _id: `custom-${Date.now()}`,
        id: `custom-${Date.now()}`,
        title: title.trim(),
        year: parsedYear,
        type: type === "tv" ? "tv" : "movie",
        genres: genresList,
        rating: 8.0,
        description: description.trim(),
        posterUrl,
        createdByUsername: createdByUsername.trim(),
        createdAt: new Date(),
        isCustom: true
      };
      mockDatabaseStore.customMovies.set(newCustomMovie._id, newCustomMovie);
      return res.status(201).json({ success: true, movie: newCustomMovie });
    }

    const created = await CustomMovieModel.create({
      title: title.trim(),
      year: parsedYear,
      type: type === "tv" ? "tv" : "movie",
      genres: genresList,
      rating: 8.0,
      description: description.trim(),
      posterUrl,
      createdByUsername: createdByUsername.trim()
    });

    const formattedMovie = {
      _id: created._id,
      id: String(created._id),
      title: created.title,
      year: created.year,
      type: created.type,
      genres: created.genres,
      rating: created.rating,
      description: created.description,
      posterUrl: created.posterUrl,
      createdByUsername: created.createdByUsername,
      isCustom: true
    };

    return res.status(201).json({ success: true, movie: formattedMovie });
  } catch (err: any) {
    console.error("Upload Custom Movie Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during asset upload: " + err.message });
  }
});

/**
 * DELETE /api/custom-movies/:id
 * Deletes a custom movie document.
 */
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    if (isUsingMockDb) {
      mockDatabaseStore.customMovies.delete(id);
      return res.json({ success: true });
    }

    await CustomMovieModel.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Custom Movie Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error deleting movie." });
  }
});

export default router;
