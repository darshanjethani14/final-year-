import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

// ─── IELTS Band Score Lookup Table (raw score out of 40) ────────────────────
function getBandScore(correct, total) {
  if (total === 0) return 0.0;
  // Linear calculation: (correct / total) * 9, rounded to nearest 0.5
  const rawBand = (correct / total) * 9;
  const roundedBand = Math.round(rawBand * 2) / 2;
  return Math.max(0.0, Math.min(9.0, roundedBand));
}

// ─── Rule-based answer comparison ────────────────────────────────────────────
function checkAnswer(userAnswer, correctAnswer) {
  if (!userAnswer) return false;
  const u = userAnswer.trim().toUpperCase();
  const c = correctAnswer.trim().toUpperCase();
  return u === c;
}

// ─── Get explanations for ALL questions in ONE passage via single Gemini call ─
async function getPassageExplanations(passage, questionsWithAnswers) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Build the questions block for the prompt
  const questionsBlock = questionsWithAnswers.map((q, i) => {
    const qType = (q.questionType || "").toLowerCase();
    let typeNote = "";
    if (qType.includes("true") || qType.includes("false") || qType.includes("not given") || qType.includes("tfng")) {
      typeNote = "[TRUE/FALSE/NOT GIVEN] TRUE=passage confirms it | FALSE=passage contradicts it | NOT GIVEN=passage doesn't mention it";
    } else if (qType.includes("multiple") || qType.includes("mcq")) {
      typeNote = "[MULTIPLE CHOICE] Explain why the correct option matches passage wording and why other options are wrong.";
    } else {
      typeNote = "[FILL IN THE BLANK / SHORT ANSWER] Find the exact keyword(s) in the passage that answer this.";
    }

    return `Q${i + 1}. ${q.question}
   Type: ${typeNote}
   Student's Answer: ${q.userAnswer || "Not Answered"}
   Correct Answer: ${q.correctAnswer}
   Result: ${q.isCorrect ? "✅ CORRECT" : "❌ INCORRECT"}`;
  }).join("\n\n");

  const prompt = `You are a senior IELTS examiner providing detailed, educational feedback to a student.

══════════════════════════════════════════════════
FULL READING PASSAGE — "${passage.passage_title}"
══════════════════════════════════════════════════
${passage.passage_text}
══════════════════════════════════════════════════

The student answered the following questions based on this passage:

${questionsBlock}

══════════════════════════════════════════════════
YOUR TASK:
For EVERY question listed above, write a detailed explanation that:
1. Quotes or closely paraphrases the EXACT sentence(s) from the passage that prove the correct answer.
2. Explains clearly WHY that passage sentence makes the answer "${questionsWithAnswers.map(q => q.correctAnswer).join('", "')}" correct.
3. If the student was WRONG: Explain what misled them and what they should have looked for.
4. If the student was CORRECT: Confirm what they understood correctly and reinforce the reading strategy.
5. Give a brief IELTS exam tip relevant to this question type.

Return ONLY a valid JSON array. No other text before or after. Format:
[
  {
    "question_number": <number>,
    "explanation": "<your detailed 4-6 sentence explanation here>"
  },
  ...
]

Write explanations in plain, friendly English. No bullet points inside the explanation. Just clear, connected sentences.`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a senior IELTS examiner. Always return a JSON array." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Build a map: question_number → explanation
    const explanationMap = {};
    parsed.forEach(item => {
      if (item.question_number !== undefined && item.explanation) {
        explanationMap[item.question_number] = item.explanation;
      }
    });
    return explanationMap;

  } catch (err) {
    console.error(`❌ Groq passage explanation error:`, err.message);
    // Return empty map — fallback will handle individual questions
    return {};
  }
}

// ─── Groq Writing Feedback ───────────────────────────────────────────────────
async function getWritingGroqFeedback(question, answer, taskType, bands) {
  const isTask1 = String(taskType) === "1";
  const rubric = isTask1 ? `
  IELTS Writing Task 1 — Official Scoring Criteria (Band 1–9):
  1. TASK ACHIEVEMENT: Covers all requirements; key features selected and illustrated.
  2. COHERENCE & COHESION: Message easy to follow; paragraphing logical.
  3. LEXICAL RESOURCE: Range and accuracy of vocabulary.
  4. GRAMMATICAL RANGE & ACCURACY: Range and accuracy of grammar.
  ` : `
  IELTS Writing Task 2 — Official Scoring Criteria (Band 1–9):
  1. TASK RESPONSE: Addresses prompt fully; clear position presented and supported.
  2. COHERENCE & COHESION: Logical flow; cohesive devices used effectively.
  3. LEXICAL RESOURCE: Range and accuracy of vocabulary.
  4. GRAMMATICAL RANGE & ACCURACY: Range and accuracy of grammar.
  `;

  const prompt = `You are a senior IELTS writing examiner. A student has written an essay for Task ${taskType}.

Official Rubric for Task ${taskType}:
${rubric}

Question:
"${question}"

Student's Essay:
"${answer}"

The local IELTS scoring model has assessed this essay and assigned an overall Band Score of ${bands.overall}.

Your task is to provide high-quality, professional feedback for each of the 4 criteria listed in the rubric above, ensuring your feedback is consistent with the Band ${bands.overall} level.

For each criterion:
1. Explain how the essay meets (or fails to meet) the Band ${bands.overall} requirements according to the rubric.
2. Quote a specific example from the student's essay.
3. Provide a clear suggestion for reaching the next band level.

Return ONLY a valid JSON object. No other text. Format:
{
  "overall_feedback": "A summary of the student's performance and key areas for improvement.",
  "task_achievement_feedback": "Detailed feedback for Task ${isTask1 ? 'Achievement' : 'Response'}.",
  "coherence_feedback": "Detailed feedback for Coherence and Cohesion.",
  "lexical_feedback": "Detailed feedback for Lexical Resource.",
  "grammar_feedback": "Detailed feedback for Grammatical Range and Accuracy."
}`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a senior IELTS examiner. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const rawContent = response.data.choices[0].message.content.trim();
    // Resilient JSON extraction
    const jsonStr = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("❌ Groq Writing feedback error:", err.message);
    return null;
  }
}

// ─── Rule-based fallback explanation ─────────────────────────────────────────
function fallbackExplanation(job) {
  if (job.isCorrect) {
    return `✅ Correct! Your answer "${job.correctAnswer}" is accurate. The passage directly supports this answer. Keep applying this reading strategy throughout the test.`;
  }
  return `❌ The correct answer is "${job.correctAnswer}". Your answer "${job.userAnswer || "Not Answered"}" does not match. In IELTS Reading, every answer can be traced directly to a specific sentence or phrase in the passage — re-read the relevant section and look for the exact keywords that match the question.`;
}

/**
 * POST /api/ai/evaluate-speaking
 * Body: { question: string, answer: string }
 * Proxies to Flask /evaluate and returns { band_score, feedback, raw_output }
 */
router.post("/evaluate-speaking", async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "Both 'question' and 'answer' are required." });
  }

  if (answer.trim().length < 5) {
    return res.status(400).json({ message: "Answer is too short to evaluate." });
  }

  try {
    const flaskResponse = await axios.post(
      `${FLASK_URL}/evaluate`,
      { question, answer },
      {
        timeout: 1800000, // 30 minutes
        headers: { "Content-Type": "application/json" }
      }
    );

    return res.json(flaskResponse.data);
  } catch (err) {
    const status = err.response?.status;
    const errorData = err.response?.data;

    if (err.code === "ECONNREFUSED") {
      console.error("❌ Flask API is not running");
      return res.status(503).json({
        message: "AI evaluation service is offline. Please start the Flask API (python app.py in the model folder)."
      });
    }

    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.error("⏳ Flask API timed out (30m limit).");
      return res.status(504).json({
        message: "AI evaluation is taking too long. This usually happens if your RAM is full or the CPU is highly loaded. Try a shorter response."
      });
    }

    console.error(`❌ Flask proxy error [${status}]:`, errorData || err.message);
    
    return res.status(status || 500).json({ 
      message: errorData?.error || "Internal server error while contacting the AI service.",
      details: errorData || null
    });
  }
});

/**
 * POST /api/ai/evaluate-speaking-audio
 * Content-Type: multipart/form-data
 * Expects: { audio: File Blob, question: string }
 * Proxies to Flask /evaluate-speaking-audio
 */
router.post("/evaluate-speaking-audio", upload.single("audio"), async (req, res) => {
  const { question } = req.body;
  const audioFile = req.file;

  if (!question || !audioFile) {
    return res.status(400).json({ message: "Both 'question' and 'audio' file are required." });
  }

  try {
    const formData = new FormData();
    formData.append("question", question);
    formData.append("audio", audioFile.buffer, {
      filename: audioFile.originalname || "audio.webm",
      contentType: audioFile.mimetype || "audio/webm",
    });

    const flaskResponse = await axios.post(
      `${FLASK_URL}/evaluate-speaking-audio`,
      formData,
      {
        timeout: 1800000,
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    return res.json(flaskResponse.data);
  } catch (err) {
    const status = err.response?.status;
    const errorData = err.response?.data;

    if (err.code === "ECONNREFUSED") {
      console.error("❌ Flask API is not running");
      return res.status(503).json({
        message: "AI evaluation service is offline. Please start the Flask API."
      });
    }

    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.error("⏳ Flask API timed out.");
      return res.status(504).json({
        message: "AI evaluation is taking too long."
      });
    }

    console.error(`❌ Flask proxy error [${status}]:`, errorData || err.message);
    
    return res.status(status || 500).json({ 
      message: errorData?.error || "Internal server error while contacting the AI service.",
      details: errorData || null
    });
  }
});

/**
 * POST /api/ai/evaluate-writing
 * Body: { question: string, answer: string, task_type?: number }
 * Proxies to Flask /evaluate-writing (fine-tuned merged_model)
 */
router.post("/evaluate-writing", async (req, res) => {
  const { question, answer, task_type = 2 } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "Both 'question' and 'answer' are required." });
  }

  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount < 50) {
    return res.status(400).json({ message: "Essay too short. Please write at least 50 words." });
  }

  try {
    const flaskResponse = await axios.post(
      `${FLASK_URL}/evaluate-writing`,
      { question, answer, task_type },   // ← task_type forwarded to fine-tuned model
      {
        timeout: 1800000, // 30 minutes
        headers: { "Content-Type": "application/json" }
      }
    );

    const data = flaskResponse.data;
    const bandScore = data.band_score ?? data.band ?? 5.0;
    const criteria = data.criteria ?? {};

    // ── Step 2: Call Groq for better feedback ───────────────────────────────
    console.log(`🤖 Groq: Generating high-quality Writing feedback for Band ${bandScore}...`);
    const groqFeedback = await getWritingGroqFeedback(question, answer, task_type, {
      overall: bandScore,
      task_achievement: criteria.task_achievement?.band ?? bandScore,
      coherence: criteria.coherence?.band ?? bandScore,
      lexical: criteria.lexical?.band ?? bandScore,
      grammar: criteria.grammar?.band ?? bandScore,
    });

    if (groqFeedback) {
      return res.json({
        band_score: bandScore,
        feedback: groqFeedback.overall_feedback,
        criteria: {
          task_achievement: { 
            band: criteria.task_achievement?.band ?? bandScore, 
            feedback: groqFeedback.task_achievement_feedback 
          },
          coherence: { 
            band: criteria.coherence?.band ?? bandScore, 
            feedback: groqFeedback.coherence_feedback 
          },
          lexical: { 
            band: criteria.lexical?.band ?? bandScore, 
            feedback: groqFeedback.lexical_feedback 
          },
          grammar: { 
            band: criteria.grammar?.band ?? bandScore, 
            feedback: groqFeedback.grammar_feedback 
          },
        },
        raw_output: data.raw_output ?? "",
      });
    }

    // Fallback to Flask data if Groq fails
    return res.json({
      band_score: bandScore,
      feedback:   data.feedback  ?? "No feedback generated.",
      criteria:   criteria,
      raw_output: data.raw_output ?? "",
    });

  } catch (err) {
    const status = err.response?.status;
    const errorData = err.response?.data;

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "AI Writing service is offline. Please start the Flask API."
      });
    }
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.error("⏳ Flask Writing API timed out.");
      return res.status(504).json({
        message: "Writing AI is taking time due to high complexity. Please wait or try a shorter response."
      });
    }
    console.error(`❌ Flask Writing proxy error [${status}]:`, errorData || err.message);
    return res.status(status || 500).json({ 
      message: errorData?.error || "Internal server error while contacting the AI Writing service." 
    });
  }
});

/**
 * POST /api/ai/evaluate-reading
 * Body: { passages: Array, answers: Object }
 *
 * Strategy:
 *  1. Rule-based scoring  — compares answers to correct_answer (case-insensitive)
 *  2. Gemini API          — ONE call per passage (3 calls total for a full test)
 *                           Sends full passage text + ALL questions at once
 *                           Returns JSON array of per-question explanations
 */
router.post("/evaluate-reading", async (req, res) => {
  const { passages, answers } = req.body;

  if (!passages || !Array.isArray(passages) || passages.length === 0) {
    return res.status(400).json({ message: "'passages' array is required." });
  }

  try {
    // ── Step 1: Rule-based scoring ─────────────────────────────────────────
    let correctCount = 0;
    let totalCount = 0;

    // Enrich each passage's questions with user answers + scoring
    const enrichedPassages = passages.map(passage => {
      const enrichedQs = (passage.questions || []).map(q => {
        totalCount++;
        const userAnswer = answers?.[q._id] || "";
        const isCorrect = checkAnswer(userAnswer, q.correct_answer || "");
        if (isCorrect) correctCount++;

        return {
          _id: q._id,
          question_number: q.question_number,
          question: q.question || "",
          questionType: q.question_type || "",
          correctAnswer: q.correct_answer || "",
          userAnswer,
          isCorrect,
        };
      });

      return { ...passage, enrichedQs };
    });

    // ── Step 2: ONE Gemini call per passage (sequential, ~3 calls total) ───
    // 3 passages × 1 call = 3 API calls — well within free tier limits
    const PASSAGE_DELAY_MS = 3000; // 3 seconds between passages
    const passageExplanationMaps = [];

    for (let i = 0; i < enrichedPassages.length; i++) {
      const passage = enrichedPassages[i];
      console.log(`🤖 Gemini: processing passage ${i + 1}/${enrichedPassages.length} — "${passage.passage_title}"`);

      const explanationMap = await getPassageExplanations(passage, passage.enrichedQs);
      passageExplanationMaps.push(explanationMap);

      // Throttle between passages (not needed after the last one)
      if (i < enrichedPassages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, PASSAGE_DELAY_MS));
      }
    }

    // ── Step 3: Band score ─────────────────────────────────────────────────
    const bandScore = getBandScore(correctCount, totalCount);

    // ── Step 4: Build detailed_feedback ───────────────────────────────────
    const detailed_feedback = enrichedPassages.map((passage, pIdx) => {
      const explanationMap = passageExplanationMaps[pIdx];

      const questionFeedback = passage.enrichedQs.map(q => {
        // Try AI explanation first (keyed by question_number), then fallback
        const explanation =
          explanationMap[q.question_number] ||
          fallbackExplanation(q);

        return {
          question_number: q.question_number,
          question_text: q.question,
          question_type: q.questionType || "fill_in_the_blank",
          user_answer: q.userAnswer || "Not Answered",
          correct_answer: q.correctAnswer,
          is_correct: q.isCorrect,
          explanation,
        };
      });

      return {
        title: passage.passage_title || `Passage ${pIdx + 1}`,
        questions: questionFeedback,
      };
    });

    // ── Step 5: Overall feedback summary ──────────────────────────────────
    const percentage = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;
    const feedback =
      `You answered ${correctCount} out of ${totalCount} questions correctly (${percentage}%). ` +
      `Your estimated IELTS Band Score for Reading is ${bandScore}. ` +
      (bandScore >= 7.0
        ? "Excellent work! You demonstrate strong reading comprehension skills."
        : bandScore >= 5.5
        ? "Good effort. Focus on skimming for main ideas and scanning for specific details."
        : "Keep practising. Pay close attention to the passage text before answering each question.");

    return res.json({
      band_score: bandScore,
      score: correctCount,
      total: totalCount,
      feedback,
      detailed_feedback,
    });

  } catch (err) {
    console.error("❌ Reading evaluation error:", err.message);
    return res.status(500).json({
      message: "An error occurred while evaluating your reading test. Please try again.",
    });
  }
});

/**
 * POST /api/ai/evaluate-listening
 * Body: { questions: Array, answers: Object, transcripts: Object }
 */
router.post("/evaluate-listening", async (req, res) => {
  const { questions, answers, transcripts } = req.body;

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "Questions array is required." });
  }

  // Group questions for batch processing to save tokens/time
  const questionsToEvaluate = questions.filter(q => !q.meta?.isExample).map(q => {
    const userAnswer = answers?.[q._id] || "";
    const isCorrect = checkAnswer(Array.isArray(userAnswer) ? userAnswer.join("") : userAnswer, q.correctAnswer);
    
    return {
      id: q._id,
      q_number: q.meta?.qNumber || q.question_number,
      text: q.text || "",
      prefix: q.meta?.prefix || "",
      suffix: q.meta?.suffix || "",
      correct_answer: q.correctAnswer,
      user_answer: Array.isArray(userAnswer) ? userAnswer.join(", ") : userAnswer,
      is_correct: isCorrect,
      transcript_context: transcripts?.[q.meta?.qNumber || q.question_number] || "Transcript not available for this segment."
    };
  });

  const prompt = `You are a Senior AI IELTS Examiner. Provide pedagogical feedback for the following Listening Test responses.
  
  CONTEXT:
  - We use Whisper AI for transcription (Transcript Context).
  - Analyze if errors are due to mishearing (phonetic gaps) or spelling.
  
  QUESTIONS DATA:
  ${JSON.stringify(questionsToEvaluate, null, 2)}
  
  TASK:
  For each question, return:
  1. is_correct: boolean
  2. band_score_contribution: number (0.225 per question roughly)
  3. feedback_text: 3-4 sentences explaining:
     - Why it is correct/incorrect.
     - Phonetic Gaps: Mention if they misheard similar sounds (e.g., 'p' vs 'b', 'teen' vs 'ty') based on the Transcript Context.
     - Spelling/Grammar: If the word was heard correctly but written wrong.

  RETURN ONLY A JSON ARRAY OF OBJECTS:
  [
    {
      "question_number": number,
      "is_correct": boolean,
      "band_score_contribution": number,
      "feedback_text": "string"
    }
  ]`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a senior IELTS examiner. Always return a JSON array." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const feedbackData = JSON.parse(jsonStr);

    res.json({ feedback: feedbackData });
  } catch (err) {
    console.error("❌ Listening evaluation error:", err.message);
    res.status(500).json({ message: "Failed to generate listening feedback." });
  }
});

export default router;


