import mongoose from "mongoose";

const passageSchema = new mongoose.Schema(
  {
    task: { type: Number, required: true },
    difficulty: { type: String },
    passage_title: { type: String, required: true },
    passage_text: { type: String, required: true },
    questions: [
      {
        question_number: Number,
        question_type: String,
        question: String,
        options: mongoose.Schema.Types.Mixed,
        correct_answer: String,
        explanation: String,
        model_prompt: String,
        feedback_prompt_template: String
      }
    ]
  },
  { timestamps: true }
);

export const Passage = mongoose.model("Passage", passageSchema);
