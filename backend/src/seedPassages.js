import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Passage } from "./models/Passage.js";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const dataPath = path.join(__dirname, "data", "reading_data.json");
    if (!fs.existsSync(dataPath)) {
      console.error(`❌ Data file not found at ${dataPath}. Please paste your JSON there.`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(rawData);

    if (!parsed.passages || parsed.passages.length === 0) {
      console.error("❌ No passages array found in JSON.");
      process.exit(1);
    }

    // Optional: Clear existing passages
    await Passage.deleteMany({});
    console.log("🧹 Cleared old passages.");

    await Passage.insertMany(parsed.passages);
    console.log(`🎉 Successfully inserted ${parsed.passages.length} passages into MongoDB!`);

  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seed();
