import express from "express";
import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { Question } from "../models/Question.js";
import { ListeningScore } from "../models/ListeningScore.js";
import { requireAuth } from "../middleware/auth.js";
import { GROQ_API_KEY } from "../config/env.js";

const router = express.Router();
const groq = new Groq({ apiKey: GROQ_API_KEY });

const normalizeAnswer = (str) => {
  if (!str) return "";
  const numMap = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20"
  };
  
  let s = str.toString().toLowerCase().trim();
  s = s.replace(/^[.,!?;]+|[.,!?;]+$/g, "");
  if (numMap[s]) return numMap[s];
  s = s.replace(/^(a|an|the)\s+/, "");
  return s;
};

const isAnswerMatch = (user, correct) => {
  const u = normalizeAnswer(user);
  const c = normalizeAnswer(correct);
  if (!u || !c) return false;
  if (u === c) return true;
  if (u + 's' === c || c + 's' === u) return true;
  if (u + 'es' === c || c + 'es' === u) return true;
  return false;
};

// Load transcripts
const TRANSCRIPTS_PATH = path.resolve("listening_transcripts.json");

/**
 * POST /api/listening/evaluate-section
 * Evaluates a single section (e.g. Questions 1-10) and returns detailed AI feedback
 */
router.post("/evaluate-section", requireAuth, async (req, res) => {
  try {
    const { sectionNumber, answers } = req.body; // answers: { "1": "32", "2": "electricity" }
    const userId = req.userId;

    if (!sectionNumber || !answers) {
      return res.status(400).json({ message: "Missing sectionNumber or answers" });
    }

    // 1. Fetch questions for this section
    const questions = await Question.find({ 
      module: "listening", 
      phase: sectionNumber 
    }).sort({ "meta.qNumber": 1 });

    if (!questions.length) {
      return res.status(404).json({ message: "No questions found for this section" });
    }

    // 2. Load the transcript for this section
    let transcripts = {};
    if (fs.existsSync(TRANSCRIPTS_PATH)) {
      transcripts = JSON.parse(fs.readFileSync(TRANSCRIPTS_PATH, "utf-8"));
    }
    const sectionTranscript = transcripts[`5.${sectionNumber}.mp3`] || "";

    // 3. Evaluate answers and prepare AI prompt context
    let correctCount = 0;
    const evaluationResults = [];
    const questionAnalysisData = [];

    console.log(`🔍 Evaluating Section ${sectionNumber} for User ${userId}`);

    questions.forEach((q) => {
      const qNum = q.meta?.qNumber;
      if (qNum === undefined || q.meta?.isExample || qNum === 0) return; // SKIP EXAMPLES (Question 0)

      const rawUserAnswer = answers[qNum] || "";
      const isCheckbox = q.meta?.renderType === "checkbox_group";
      
      let isCorrect = false;
      let userAnswerString = "";

      if (isCheckbox) {
        const userLetters = Array.isArray(rawUserAnswer) ? rawUserAnswer : [];
        isCorrect = userLetters.includes(q.correctAnswer);
        userAnswerString = userLetters.join(", ");
      } else {
        userAnswerString = rawUserAnswer.toString();
        isCorrect = isAnswerMatch(userAnswerString, q.correctAnswer);
      }

      if (isCorrect) correctCount++;

      evaluationResults.push({
        questionNumber: qNum,
        text: q.text,
        userAnswer: userAnswerString,
        correctAnswer: q.correctAnswer,
        isCorrect
      });

      // Prepare data for AI to justify
      const optionsText = q.options?.length > 0 
        ? q.options.map(opt => `${opt.value}: ${opt.text}`).join(", ") 
        : "";

      if (isCheckbox) {
          // For checkbox groups, we want to explain the set
          const groupId = q.meta.groupId;
          const allQsInGroup = questions.filter(sq => sq.meta.groupId === groupId);
          const correctLetters = allQsInGroup.map(sq => sq.correctAnswer).join(", ");
          
          questionAnalysisData.push({
            num: qNum,
            text: q.text,
            userAns: userAnswerString || "(No answer)",
            correctAns: q.correctAnswer,
            status: isCorrect ? "CORRECT" : "INCORRECT",
            options: optionsText,
            context: `This is a 'Choose Three' question. The student's full selection was [${userAnswerString}]. The complete set of correct answers for this group is [${correctLetters}]. Explain why ${q.correctAnswer} is specifically correct/incorrect in this context.`
          });
      } else {
          questionAnalysisData.push({
            num: qNum,
            text: q.text,
            userAns: userAnswerString || "(No answer)",
            correctAns: q.correctAnswer,
            status: isCorrect ? "CORRECT" : "INCORRECT",
            options: optionsText
          });
      }
    });

    // 4. Generate AI Feedback with Justifications
    let aiFeedback = "";
    
    try {
        console.log(`🤖 Requesting Justification for ${questionAnalysisData.length} answers...`);
        const prompt = `
          You are a senior IELTS Listening examiner. 
          Analyze the student's performance for Section ${sectionNumber} using the transcript provided.
          
          TRANSCRIPT:
          "${sectionTranscript}"
          
          STUDENT PERFORMANCE:
          ${questionAnalysisData.map(d => `
            Question ${d.num}: "${d.text}"
            ${d.options ? `- Options: ${d.options}` : ""}
            - Student wrote: "${d.userAns}"
            - Correct answer: "${d.correctAns}"
            - Status: ${d.status}
            ${d.context ? `- Context: ${d.context}` : ""}
          `).join("\n")}
               TASK:
          Provide a hyper-specific pedagogical justification for EVERY question number listed above.
          - Use the EXACT Question Number (e.g., "${questionAnalysisData[0]?.num}") as the key in your JSON.
          - JUSTIFICATION RULES:
            1. DO NOT repeat the question text, title, or instructions (e.g., skip "Choose THREE letters...").
            2. DO NOT use markdown bolding (no **).
            3. DO NOT start with "Question X:" or "Justification:".
            4. START DIRECTLY with the reasoning (e.g., "The speaker confirms...").
            5. Use EXACT QUOTES from the TRANSCRIPT.
          
          You MUST return your response in EXACTLY this JSON format:
          {
            "justifications": {
              "1": "Justification text...",
              "2": "Justification text..."
            }
          }

        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const aiResponse = completion.choices[0].message.content;
        console.log("🤖 AI Response Received");
        const parsedData = JSON.parse(aiResponse);
        const justifications = parsedData.justifications || {};

        // Attach feedback to results
        const finalResults = evaluationResults.map(r => {
          const qNumStr = r.questionNumber.toString();
          let fb = justifications[qNumStr] || justifications[r.questionNumber] || justifications[`Question ${qNumStr}`];
          
          if (!fb) {
             fb = "Based on the transcript, this answer is " + (r.isCorrect ? "correct" : "incorrect") + ".";
          }
          
          // ADVANCED SCRUBBING: Remove common AI artifacts and repetitions
          fb = fb.replace(/^\*\*|\*\*$/g, "") // Remove bolding
                 .replace(/^Choose\s+THREE\s+letters.*?\*\*:?\s*/i, "") // Remove "Choose THREE letters..."
                 .replace(/^Question\s+\d+:\s*/i, "") // Remove "Question X:"
                 .replace(/^Justification:\s*/i, "") // Remove "Justification:"
                 .replace(/^\*\*.*?\*\*:?\s*/i, "") // Remove any leading bolded title
                 .trim();
          
          return { ...r, feedback: fb };
        });

        console.log(`✅ Section ${sectionNumber} complete: ${correctCount}/${questionAnalysisData.length}`);

        return res.json({
          sectionNumber,
          score: `${correctCount}/${questionAnalysisData.length}`,
          results: finalResults,
          detailedFeedback: aiFeedback
        });

    } catch (aiErr) {
        console.error("Groq AI Error:", aiErr);
        // Fallback for AI errors
        const fallbackResults = evaluationResults.map(r => ({
          ...r,
          feedback: "Transcript analysis is temporarily unavailable. Based on the rules, this answer is " + (r.isCorrect ? "correct" : "incorrect") + "."
        }));

        return res.json({
          sectionNumber,
          score: `${correctCount}/${evaluationResults.length}`,
          results: fallbackResults,
          detailedFeedback: "The AI evaluator is currently busy. Please review your answers below."
        });
    }

  } catch (err) {
    console.error("Listening section evaluation error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
