import mongoose from "mongoose";

const writingScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bandScore: { type: Number, required: true },
    feedback: { type: String, required: true },
    essay: { type: String, required: true },
    takenAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "writing_scores" }
);

export const WritingScore = mongoose.model("WritingScore", writingScoreSchema);
