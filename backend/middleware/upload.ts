import multer from "multer";

// Configure memory storage to keep incoming file buffer in memory
// so it can be streamed directly to Cloudinary CDN without writing binary files to MongoDB
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image file uploads (JPEG, PNG, WEBP) are allowed."));
    }
  }
});
