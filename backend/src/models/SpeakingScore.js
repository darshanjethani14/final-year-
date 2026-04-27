import mongoose from "mongoose";

const speakingScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bandScore: { type: Number, required: true },
    feedback: { type: String, required: true },
    audioUrl: { type: String },
    takenAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "speaking_scores" }
);

export const SpeakingScore = mongoose.model("SpeakingScore", speakingScoreSchema);
