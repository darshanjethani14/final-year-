import express from "express";
import { TestScore } from "../models/TestScore.js";

const router = express.Router();

// GET /api/dashboard/summary/:userId
router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [reading, listening, writing, speaking] = await Promise.all([
      import("../models/ReadingScore.js").then(m => m.ReadingScore.findOne({ user: userId }).sort({ takenAt: -1 })),
      import("../models/ListeningScore.js").then(m => m.ListeningScore.findOne({ user: userId }).sort({ takenAt: -1 })),
      import("../models/WritingScore.js").then(m => m.WritingScore.findOne({ user: userId }).sort({ takenAt: -1 })),
      import("../models/SpeakingScore.js").then(m => m.SpeakingScore.findOne({ user: userId }).sort({ takenAt: -1 }))
    ]);

    const getBand = (test) => {
      if (!test) return 0;
      if (test.bandScore) return test.bandScore;
      // Handle raw listening scores
      if (test.score > 9) {
        if (test.score >= 39) return 9.0;
        if (test.score >= 37) return 8.5;
        if (test.score >= 35) return 8.0;
        if (test.score >= 32) return 7.5;
        if (test.score >= 30) return 7.0;
        if (test.score >= 26) return 6.5;
        if (test.score >= 23) return 6.0;
        if (test.score >= 20) return 5.5;
        if (test.score >= 16) return 5.0;
        if (test.score >= 13) return 4.5;
        if (test.score >= 10) return 4.0;
        return 3.5;
      }
      return test.score || 0;
    };

    const latest = {
      reading: getBand(reading),
      listening: getBand(listening),
      writing: getBand(writing),
      speaking: getBand(speaking),
      overall: 0
    };

    latest.overall = Math.floor(((latest.reading + latest.listening + latest.writing + latest.speaking) / 4) * 2) / 2;

    const [readingHist, listeningHist, writingHist, speakingHist] = await Promise.all([
      import("../models/ReadingScore.js").then(m => m.ReadingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10)),
      import("../models/ListeningScore.js").then(m => m.ListeningScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10)),
      import("../models/WritingScore.js").then(m => m.WritingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10)),
      import("../models/SpeakingScore.js").then(m => m.SpeakingScore.find({ user: userId }).sort({ takenAt: -1 }).limit(10))
    ]);

    const history = [
      ...readingHist.map(t => ({ ...t.toObject(), module: 'reading' })),
      ...listeningHist.map(t => ({ ...t.toObject(), module: 'listening' })),
      ...writingHist.map(t => ({ ...t.toObject(), module: 'writing' })),
      ...speakingHist.map(t => ({ ...t.toObject(), module: 'speaking' }))
    ].sort((a, b) => new Date(b.takenAt || b.createdAt) - new Date(a.takenAt || a.createdAt)).slice(0, 10);

    res.json({ latest, history });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
