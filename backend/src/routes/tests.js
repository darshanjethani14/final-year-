import express from "express";
import { Question } from "../models/Question.js";
import { ReadingScore } from "../models/ReadingScore.js";
import { Passage } from "../models/Passage.js";
import { WritingScore } from "../models/WritingScore.js";
import { ListeningScore } from "../models/ListeningScore.js";
import { SpeakingScore } from "../models/SpeakingScore.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/tests/writing-prompts
router.get("/writing-prompts", async (req, res) => {
  try {
    const [t1Arr, t2Arr] = await Promise.all([
      Question.aggregate([
        { $match: { module: "writing", "meta.taskNumber": 1 } },
        { $sample: { size: 1 } }
      ]),
      Question.aggregate([
        { $match: { module: "writing", "meta.taskNumber": 2 } },
        { $sample: { size: 1 } }
      ])
    ]);

    const t1 = t1Arr[0];
    const t2 = t2Arr[0];

    if (!t1 || !t2) {
      return res.status(404).json([]);
    }

    // Return exact format expected by frontend dbTasks pipeline
    res.json([t1, t2]);
  } catch (err) {
    console.error("Get writing prompts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/tests/speaking-prompts
router.get("/speaking-prompts", async (req, res) => {
  try {
    const list = await Question.aggregate([
      { $match: { module: "speaking", "meta.type": "speaking_test" } },
      { $sample: { size: 1 } }
    ]);
    if (!list || list.length === 0) {
      return res.status(404).json({ message: "No speaking prompt found" });
    }
    res.json(list[0].meta);
  } catch (err) {
    console.error("Get speaking prompts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/tests/questions?module=reading&phase=1
router.get("/questions", async (req, res) => {
  try {
    const { module, phase } = req.query;
    const filter = {};
    if (module) filter.module = module;
    if (phase) filter.phase = Number(phase);

    const questions = await Question.find(filter).limit(50);
    res.json(questions);
  } catch (err) {
    console.error("Get questions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/tests/passages
router.get("/passages", async (req, res) => {
  try {
    const randoms = await Passage.aggregate([{ $sample: { size: 3 } }]);
    res.json(randoms);
  } catch (err) {
    console.error("Get passages error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/tests/scores
// Body: { userId, module, score, bandScore, feedback, answers, essay }
router.post("/scores", async (req, res) => {
  try {
    const { userId, module, score, bandScore, feedback, answers, essay } = req.body;
    if (!userId || !module) {
      return res.status(400).json({ message: "userId and module are required" });
    }

    let result;
    switch (module.toLowerCase()) {
      case "reading":
        result = await ReadingScore.create({ 
          user: userId, 
          score, 
          bandScore, 
          feedback, 
          answers 
        });
        break;
      case "listening":
        result = await ListeningScore.create({ user: userId, score, bandScore, answers });
        break;
      case "writing":
        result = await WritingScore.create({ user: userId, bandScore, feedback, essay });
        break;
      case "speaking":
        result = await SpeakingScore.create({ user: userId, bandScore, feedback });
        break;
      default:
        return res.status(400).json({ message: "Invalid module" });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error("Post score error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/tests/history/:userId
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [reading, listening, writing, speaking] = await Promise.all([
      ReadingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10),
      ListeningScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10),
      WritingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10),
      SpeakingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10)
    ]);

    res.json({
      reading,
      listening,
      writing,
      speaking
    });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
