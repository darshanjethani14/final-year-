import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, 'src', 'data', 'reading_data.json');

async function cleanData() {
  try {
    console.log(`Reading data from: ${DATA_PATH}`);
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.passages) {
      console.error("Error: JSON does not contain 'passages' array.");
      return;
    }

    let removedCount = 0;

    data.passages.forEach(passage => {
      if (passage.questions && Array.isArray(passage.questions)) {
        passage.questions.forEach(question => {
          // Fields to remove
          const redundantFields = ['explanation', 'model_prompt', 'feedback_prompt_template'];
          redundantFields.forEach(field => {
            if (question[field] !== undefined) {
              delete question[field];
              removedCount++;
            }
          });
        });
      }
    });

    console.log(`Cleaning complete. Removed ${removedCount} redundant fields.`);
    
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved optimized data to: ${DATA_PATH}`);

    const stats = fs.statSync(DATA_PATH);
    console.log(`New file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

cleanData();
