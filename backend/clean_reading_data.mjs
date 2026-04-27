import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "reading_data.json");

async function cleanData() {
  try {
    console.log("Reading reading_data.json...");
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    if (!raw.passages) {
      throw new Error("No passages found in JSON");
    }

    console.log(`Cleaning ${raw.passages.length} passages...`);

    const cleanedPassages = raw.passages.map(p => {
      const cleanedQuestions = (p.questions || []).map(q => {
        // Keep only essential fields
        const { 
          question_number, 
          question_type, 
          question, 
          options, 
          correct_answer 
        } = q;

        return {
          question_number,
          question_type,
          question,
          options,
          correct_answer
        };
      });

      return {
        ...p,
        questions: cleanedQuestions
      };
    });

    const cleanedData = {
      ...raw,
      passages: cleanedPassages
    };

    console.log("Writing cleaned data back to reading_data.json...");
    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), "utf8");
    
    console.log("✅ Successfully cleaned reading_data.json!");
    console.log("Redundant fields (explanation, model_prompt, feedback_prompt_template) have been removed.");
  } catch (err) {
    console.error("❌ Cleaning failed:", err);
    process.exit(1);
  }
}

cleanData();
