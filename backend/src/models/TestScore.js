import mongoose from "mongoose";

const testScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listening: Number,
    reading: Number,
    writing: Number,
    speaking: Number,
    overall: Number,
    takenAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const TestScore = mongoose.model("TestScore", testScoreSchema);

