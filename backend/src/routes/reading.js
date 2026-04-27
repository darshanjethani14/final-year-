import express from "express";
import axios from "axios";
import { Passage } from "../models/Passage.js";

const router = express.Router();

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000; // Groq is fast and usually has good limits

// ─── IELTS Band Score Table ────────────────────────────────────────────────────
const BAND_TABLE = [
  { min: 39, band: 9.0 }, { min: 37, band: 8.5 }, { min: 35, band: 8.0 },
  { min: 33, band: 7.5 }, { min: 30, band: 7.0 }, { min: 27, band: 6.5 },
  { min: 23, band: 6.0 }, { min: 19, band: 5.5 }, { min: 15, band: 5.0 },
  { min: 13, band: 4.5 }, { min: 10, band: 4.0 }, { min: 8, band: 3.5 },
  { min: 6, band: 3.0 }, { min: 4, band: 2.5 }, { min: 0, band: 2.0 },
];

function getBandScore(correct, total) {
  const scaled = Math.round((correct / Math.max(total, 1)) * 40);
  for (const entry of BAND_TABLE) {
    if (scaled >= entry.min) return entry.band;
  }
  return 2.0;
}

// ─── Utility: Sleep ───────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Answer Checker ───────────────────────────────────────────────────────────
function checkAnswer(userAnswer, question) {
  if (!userAnswer || userAnswer.trim() === "") return false;
  const u = userAnswer.trim().toUpperCase();
  const c = (question.correct_answer || "").trim().toUpperCase();

  if (u === c) return true;

  if (question.question_type === "MCQ" || question.question_type === "Multiple Choice") {
    if (["A", "B", "C", "D"].includes(c) && u === c) return true;
    if (question.options && question.options[u]) {
      const optionText = question.options[u].trim().toUpperCase();
      if (optionText === c) return true;
    }
  }

  if (c === "NOT GIVEN" && (u === "NG" || u === "NOT GIVEN")) return true;

  return false;
}

// ─── Evaluate All Passages ────────────────────────────────────────────────────
function evaluateAnswers(passages, userAnswers) {
  const results = [];
  let correctCount = 0;
  let totalCount = 0;

  for (const passage of passages) {
    for (const q of (passage.questions || [])) {
      totalCount++;
      const userAnswer = userAnswers[q._id] || "";
      const isCorrect = checkAnswer(userAnswer, q);
      if (isCorrect) correctCount++;

      results.push({
        passageTitle: passage.passage_title,
        questionId: q._id,
        questionNumber: q.question_number,
        questionType: q.question_type,
        question: q.question,
        options: q.options || null,
        userAnswer,
        correctAnswer: q.correct_answer,
        storedExplanation: q.explanation || "",
        isCorrect,
      });
    }
  }
  return { results, correctCount, totalCount };
}

// ─── Smart Fallback ───────────────────────────────────────────────────────────
function smartFallback(r) {
  if (r.isCorrect) {
    const expl = r.storedExplanation || `Your answer "${r.userAnswer}" is correct.`;
    return `✅ Correct! ${expl}`;
  }
  const expl = r.storedExplanation || `The correct answer is "${r.correctAnswer}".`;
  return `❌ Your answer "${r.userAnswer || "(no answer)"}" is incorrect. ${expl}`;
}

// ─── Format passage text ──────────────────────────────────────────────────────
function formatPassage(passageText) {
  return passageText
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line, i) => {
      const trimmed = line.trim();
      if (/^[A-E]\s/.test(trimmed) || /^\[Paragraph [A-E]\]/.test(trimmed)) return trimmed;
      return `[Paragraph ${String.fromCharCode(65 + i)}] ${trimmed}`;
    })
    .join("\n\n");
}

// ─── Build prompt block ───────────────────────────────────────────────────────
function buildQuestionBlock(results) {
  return results
    .map((r, i) => {
      const qNum = r.questionNumber || i + 1;
      const qLabel =
        r.questionType === "MCQ" || r.questionType === "Multiple Choice"
          ? "Multiple Choice"
          : r.questionType === "TRUE_FALSE_NOT_GIVEN" || r.questionType === "True/False/Not Given"
          ? "True / False / Not Given"
          : "Fill in the Blanks";

      return `QuestNo: ${qNum} [Type: ${qLabel}]
   Question: ${r.question}
   Options: ${r.options ? JSON.stringify(r.options) : "None"}
   Correct Answer: ${r.correctAnswer}
   User's Selection: ${r.userAnswer || "(blank)"}`;
    })
    .join("\n\n---\n");
}

// ─── Single Groq Call ─────────────────────────────────────────────────────────
async function callGroq(passageTitle, formattedPassage, questionResults, attempt = 0) {
  const key = process.env.GROQ_API_KEY; 
  if (!key) throw new Error("GROQ_API_KEY missing");

  const questionsContext = buildQuestionBlock(questionResults);
  
  const prompt = `You are an expert IELTS Reading examiner. Examine the passage and student answers. 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSAGE: "${passageTitle}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formattedPassage}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT ANSWERS:
${questionsContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR GOAL: For every question, write a high-pedagogy explanation in exactly this style:
"The correct answer is [CORRECT_ANSWER] because the passage states that '[QUOTE FROM TEXT]' ([PARAGRAPH REFERENCE]), which directly [SUPPORTS/CONTRADICTS] the statement. [LOGICAL REASONING]. The user's answer is [USER_ANSWER], which is [CORRECT/INCORRECT] because [REASON]. To answer such questions correctly, [EXAM TIP]."

REQUIRED FORMAT: Return ONLY a valid JSON array of strings, one per question. No intro/outro.
Format: ["explanation for Q1", "explanation for Q2", ...]`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an IELTS examiner. Output ONLY a JSON array of strings." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed) || parsed.length !== questionResults.length) {
      throw new Error("Mismatch in questions/answers count");
    }

    return parsed;
  } catch (err) {
    if (err.response) {
      console.error(`[Groq Error ${err.response.status}]`, JSON.stringify(err.response.data));
      if (err.response.status === 429 && attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY * (attempt + 1));
        return callGroq(passageTitle, formattedPassage, questionResults, attempt + 1);
      }
    }
    throw err;
  }
}

async function getAIFeedbackForPassage(passage, questionResults) {
  try {
    const formattedPassage = formatPassage(passage.passage_text);
    console.log(`[Reading-Groq] Evaluating: "${passage.passage_title}" (${questionResults.length} questions)...`);
    
    const explanations = await callGroq(passage.passage_title, formattedPassage, questionResults);
    console.log(`[Reading-Groq] ✅ Done: "${passage.passage_title}"`);
    return explanations;
  } catch (err) {
    console.error(`[Reading-Groq] ❌ Failure: "${passage.passage_title}" - ${err.message}`);
    console.log(`[Reading-Groq] 💡 Using database fallback explanations instead.`);
    return questionResults.map(r => smartFallback(r));
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const picked = [];
    for (const t of [1, 2, 3]) {
      const [p] = await Passage.aggregate([{ $match: { task: t } }, { $sample: { size: 1 } }]);
      if (p) picked.push(p);
    }
    res.json(picked);
  } catch (err) {
    res.status(500).json({ message: "Fetch fail" });
  }
});

router.post("/evaluate", async (req, res) => {
  try {
    const { passages, userAnswers } = req.body;
    const { results, correctCount, totalCount } = evaluateAnswers(passages, userAnswers || {});
    const finalResults = [];

    for (const passage of passages) {
      const passageQs = results.filter((r) => r.passageTitle === passage.passage_title);
      const explanations = await getAIFeedbackForPassage(passage, passageQs);
      passageQs.forEach((r, i) => {
        r.explanation = explanations[i] || smartFallback(r);
        finalResults.push(r);
      });
    }

    res.json({
      score: correctCount,
      total: totalCount,
      bandScore: getBandScore(correctCount, totalCount),
      results: finalResults,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eval fail" });
  }
});

export default router;
