import mongoose from "mongoose";

const listeningScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    bandScore: { type: Number },
    answers: { type: Object, default: {} },
    feedback: { type: Array, default: [] },
    takenAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "listening_scores" }
);

export const ListeningScore = mongoose.model("ListeningScore", listeningScoreSchema);
