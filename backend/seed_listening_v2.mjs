import "dotenv/config";
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  phase: { type: Number, min: 1, max: 4 },
  text: { type: String, required: true },
  options: [{ text: String, value: String }],
  correctAnswer: mongoose.Schema.Types.Mixed,
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Question = mongoose.model("Question", questionSchema);

const rawData = {
  "sections": [
    {
      "section_number": 1,
      "groups": [
        {
          "heading": "Questions 1-5",
          "instruction": "Complete the table below. Write NO MORE THAN ONE WORD OR A NUMBER for each answer.",
          "render_type": "table",
          "table_title": "Apartment For Rent",
          "table_headers": ["Feature", "Details"],
          "rows": [
            { "label": "Street", "question_number": 0, "correct_answer": "Bridge", "is_example": true, "suffix": "" },
            { "label": "Street No:", "question_number": 1, "correct_answer": "32" },
            { "label": "Utilities", "question_number": 2, "prefix": "Gas, heat, water,", "suffix": ", phone", "correct_answer": "electricity" },
            { "label": "Utilities (not incl.)", "question_number": 3, "correct_answer": "Internet" },
            { "label": "Public transport", "question_number": 4, "prefix": "Underground,", "correct_answer": "bus" },
            { "label": "Tenant's name", "question_number": 5, "prefix": "John", "correct_answer": "Hooper" }
          ]
        },
        {
          "heading": "Questions 6-8",
          "instruction": "Choose THREE letters, A-F. Which THREE things should the caller bring to the meeting?",
          "render_type": "checkbox_group",
          "options": {
            "A": "Driving license", "B": "Passport", "C": "Tax bill", "D": "Employment contract", "E": "Reference from a friend or colleague", "F": "Reference from an employer"
          },
          "correct_answers": ["B", "D", "E"]
        },
        {
          "heading": "Questions 9-10",
          "instruction": "Choose the correct letters, A, B, or C.",
          "render_type": "standard_mcq",
          "questions": [
            { "question_number": 9, "text": "What time do the caller and apartment manager decide to meet?", "options": { "A": "5:30 PM", "B": "6:00 PM", "C": "6:30 PM" }, "correct_answer": "C" },
            { "question_number": 10, "text": "Where do they decide to meet?", "options": { "A": "Near the manager's apartment", "B": "At the caller's future apartment", "C": "At the office" }, "correct_answer": "B" }
          ]
        }
      ]
    },
    {
      "section_number": 2,
      "groups": [
        {
          "heading": "Questions 11-16",
          "instruction": "Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
          "render_type": "table",
          "table_title": "Ticket Information",
          "table_headers": ["Ticket type", "Ticket Cost"],
          "rows": [
            { "label": "Adult’s ticket", "question_number": 11, "suffix": "pounds", "correct_answer": "24" },
            { "label": "Child’s ticket (5-15 years)", "question_number": 12, "suffix": "pounds", "correct_answer": "18" },
            { "label": "Children under 5 years", "question_number": 13, "correct_answer": "free" },
            { "label": "Reduced tariff (students/disabled)", "question_number": 14, "suffix": "pounds", "correct_answer": "19" },
            { "label": "Family ticket (2 adults, 3 children)", "question_number": 15, "suffix": "pounds","correct_answer": "55" },
            { "label": "Annual membership", "question_number": 16, "suffix": "pounds", "correct_answer": "107" }
          ]
        },
        {
          "heading": "Questions 17-20",
          "instruction": "Complete the information about ordering tickets below. Write NO MORE THAN TWO WORDS for each answer.",
          "render_type": "sentence_completion",
          "questions": [
            { "question_number": 17, "prefix_text": "The easiest way, is to buy your tickets", "suffix_text": ".", "correct_answer": "online" },
            { "question_number": 18, "prefix_text": "Make sure that you receive a", "suffix_text": "of your booking!", "correct_answer": "confirmation email" },
            { "question_number": 19, "prefix_text": "The second way is to book your tickets", "suffix_text": ".", "correct_answer": "by telephone" },
            { "question_number": 20, "prefix_text": "If you don’t want to plan your visit in advance, you can simply purchase the tickets", "suffix_text": "in ticket kiosks.", "correct_answer": "in person" }
          ]
        }
      ]
    },
    {
      "section_number": 3,
      "groups": [
        {
          "heading": "Questions 21-23",
          "instruction": "Complete the information below. Write NO MORE THAN THREE WORDS for each answer.",
          "render_type": "sentence_completion",
          "questions": [
            { "question_number": 21, "prefix_text": "The total course duration is", "correct_answer": "seven weeks" },
            { "question_number": 22, "prefix_text": "During the final project students will work in teams of", "correct_answer": "five people" },
            { "question_number": 23, "prefix_text": "The professor told that the key thing in marketing strategy is to", "correct_answer": "grab people's attention" }
          ]
        },
        {
          "heading": "Questions 24-28",
          "instruction": "Choose FIVE letters, A-I. What FIVE modules does the course include?",
          "render_type": "checkbox_group",
          "options": {
            "A": "Marketing", "B": "Design of custom logos", "C": "Product management", "D": "Branding", "E": "E-commerce", "F": "Advertising", "G": "Analytics", "H": "Customer attraction", "I": "Business strategies"
          },
          "correct_answers": ["A", "D", "E", "F", "H"]
        },
        {
          "heading": "Questions 29-30",
          "instruction": "Complete the information below. Write NO MORE THAN TWO WORDS for each answer.",
          "render_type": "sentence_completion",
          "questions": [
            { "question_number": 29, "prefix_text": "The next lecture is in the big classroom on the", "correct_answer": "ground floor" },
            { "question_number": 30, "prefix_text": "Students need to take their last week", "correct_answer": "assignment" }
          ]
        }
      ]
    },
    {
      "section_number": 4,
      "groups": [
        {
          "heading": "Questions 31-35",
          "instruction": "Choose the correct letter, A, B, or C.",
          "render_type": "standard_mcq",
          "questions": [
            { "question_number": 31, "text": "Initially, the Great Wall was built to", "options": { "A": "Prevent invaders from entering China", "B": "Function as a psychological barrier", "C": "show country’s enduring strength" }, "correct_answer": "A" },
            { "question_number": 32, "text": "The construction of the Great Wall started", "options": { "A": "in third century B.C.", "B": "in 220 B.C.", "C": "in 390 A.D." }, "correct_answer": "B" },
            { "question_number": 33, "text": "The Chinese name of the monument is", "options": { "A": "the Great Wall", "B": "the Big Wall", "C": "the Long Wall" }, "correct_answer": "C" },
            { "question_number": 34, "text": "The wall as it exists today was constructed mainly by", "options": { "A": "Qin dynasty", "B": "Northern Wei dynasty", "C": "Ming dynasty" }, "correct_answer": "C" },
            { "question_number": 35, "text": "During the Ming dynasty, the wall’s main purpose was", "options": { "A": "to be a military fortification", "B": "to protect caravans traveling along the trade routes", "C": "to contribute to the defense of the country" }, "correct_answer": "C" }
          ]
        },
        {
          "heading": "Questions 36-40",
          "instruction": "Write NO MORE THAN THREE WORDS for each answer.",
          "render_type": "sentence_completion",
          "questions": [
            { "question_number": 36, "prefix_text": "Before the use of bricks, the Great Wall was mainly built from stones, wood and", "correct_answer": "rammed earth" },
            { "question_number": 37, "prefix_text": "Many western sections of the wall are constructed from mud and thus are more", "correct_answer": "susceptible to erosion" },
            { "question_number": 38, "prefix_text": "A part of the wall in Gansu province may disappear in the next 20 years, due to", "correct_answer": "frequent sandstorms" },
            { "question_number": 39, "prefix_text": "To see the wall from the Moon would require superhuman", "correct_answer": "eyesight" },
            { "question_number": 40, "prefix_text": "The Great Wall is generally recognized as one of the most impressive","suffix_text": "in history.", "correct_answer": "architectural feats" }
          ]
        }
      ]
    }
  ]
};

const transformedQuestions = [];

rawData.sections.forEach(section => {
  section.groups.forEach(group => {
    if (group.render_type === "checkbox_group") {
      const match = group.heading.match(/(\d+)-(\d+)/);
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      
      for (let i = start; i <= end; i++) {
        transformedQuestions.push({
          module: "listening",
          phase: section.section_number,
          text: group.instruction,
          options: Object.entries(group.options).map(([k, v]) => ({ text: v, value: k })),
          correctAnswer: group.correct_answers[i - start],
          meta: {
            qNumber: i,
            renderType: group.render_type,
            heading: group.heading,
            instruction: group.instruction,
            groupId: group.heading
          }
        });
      }
    } else if (group.render_type === "table") {
      group.rows.forEach(row => {
        transformedQuestions.push({
          module: "listening",
          phase: section.section_number,
          text: row.label || "Table Question",
          correctAnswer: row.correct_answer,
          meta: {
            qNumber: row.question_number,
            renderType: group.render_type,
            heading: group.heading,
            instruction: group.instruction,
            tableTitle: group.table_title,
            tableHeaders: group.table_headers,
            label: row.label,
            prefix: row.prefix,
            suffix: row.suffix,
            isExample: row.is_example
          }
        });
      });
    } else {
      const qList = group.questions || [];
      qList.forEach(q => {
        transformedQuestions.push({
          module: "listening",
          phase: section.section_number,
          text: q.text || q.label || group.instruction || "Question",
          options: q.options ? Object.entries(q.options).map(([k, v]) => ({ text: v, value: k })) : [],
          correctAnswer: q.correct_answer,
          meta: {
            qNumber: q.question_number,
            renderType: group.render_type,
            heading: group.heading,
            instruction: group.instruction,
            prefix: q.prefix_text,
            suffix: q.suffix_text,
            label: q.label,
            isExample: q.is_example
          }
        });
      });
    }
  });
});

async function seed() {
  try {
    const uri = (process.env.MONGODB_URI || "").replace(/^['"]|['"]$/g, '');
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
    await Question.deleteMany({ module: "listening" });
    await Question.insertMany(transformedQuestions);
    console.log(`✅ ${transformedQuestions.length} New listening questions added!`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();
