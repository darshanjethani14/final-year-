import "dotenv/config";

// Centralized environment variables to avoid race conditions with dotenv
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
export const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const NODE_ENV = process.env.NODE_ENV || "development";

// Basic validation for critical variables
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is missing in .env");
}

if (JWT_SECRET === "dev-secret" && NODE_ENV === "production") {
  console.error("❌ CRITICAL: Using default JWT_SECRET in production!");
}

console.log(`✅ Environment loaded: JWT_SECRET detected [${JWT_SECRET !== "dev-secret"}]`);
