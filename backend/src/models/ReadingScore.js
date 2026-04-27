import mongoose from "mongoose";

const readingScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    bandScore: { type: Number },
    feedback: { type: String },
    answers: { type: Object, default: {} }, // Stores user's answers
    takenAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "reading_scores" }
);

export const ReadingScore = mongoose.model("ReadingScore", readingScoreSchema);
