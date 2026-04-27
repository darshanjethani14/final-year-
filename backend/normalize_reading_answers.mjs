import "dotenv/config";
import mongoose from "mongoose";
import { Passage } from "./src/models/Passage.js";

async function normalize() {
  try {
    const uri = (process.env.MONGODB_URI || "").replace(/^['"]|['"]$/g, '');
    if (!uri) throw new Error("MONGODB_URI mission in .env");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected");

    const passages = await Passage.find({});
    console.log(`Processing ${passages.length} passages...`);

    let updatedCount = 0;
    let questionsProcessed = 0;

    for (const passage of passages) {
      let passageModified = false;
      
      for (const q of passage.questions) {
        questionsProcessed++;
        
        // Only normalize if options exist and is an object
        if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
          const currentAnswer = (q.correct_answer || "").trim();
          
          // If the answer is already a single letter key (A-D), skip
          if (/^[A-D]$/i.test(currentAnswer) && q.options[currentAnswer.toUpperCase()]) {
            continue;
          }

          // Search for the key that has this text value
          const entries = Object.entries(q.options);
          const foundEntry = entries.find(([key, val]) => 
            String(val).trim().toLowerCase() === currentAnswer.toLowerCase()
          );

          if (foundEntry) {
            const [newKey, newVal] = foundEntry;
            console.log(`  [Passage: ${passage.passage_title}] Q${q.question_number}: Normalizing "${currentAnswer}" -> "${newKey}"`);
            q.correct_answer = newKey.toUpperCase();
            passageModified = true;
            updatedCount++;
          }
        }
      }

      if (passageModified) {
        await passage.save();
      }
    }

    console.log("\n--- Normalization Summary ---");
    console.log(`Passages processed: ${passages.length}`);
    console.log(`Questions inspected: ${questionsProcessed}`);
    console.log(`Correct answers updated to labels: ${updatedCount}`);
    
    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

normalize();
