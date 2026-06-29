import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log("Cine-Stream [Phase 3]: Cloudinary CDN successfully configured.");
} else {
  console.warn("Cine-Stream [Phase 3]: Cloudinary credentials unconfigured. Uploads will use simulated CDN stream URLs.");
}

export default cloudinary;
