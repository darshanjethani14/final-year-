import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["listening", "reading", "writing", "speaking"],
      required: true
    },
    phase: { type: Number, min: 1, max: 4 },
    text: { type: String, required: true },
    options: [{ text: String, value: String }],
    correctAnswer: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);

