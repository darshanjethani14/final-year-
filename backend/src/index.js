import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/tests.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";
import readingRoutes from "./routes/reading.js";
import listeningRoutes from "./routes/listening.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use("/api/listening-audios", express.static("Listening_audios"));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "AI IELTS backend" });
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes – require a valid JWT token
app.use("/api/tests", requireAuth, testRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/reading", requireAuth, readingRoutes);
app.use("/api/listening", requireAuth, listeningRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });