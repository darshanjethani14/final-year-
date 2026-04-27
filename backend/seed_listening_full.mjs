import "dotenv/config";
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    phase: { type: Number, min: 1, max: 4 },
    text: { type: String, required: true },
    options: [{ text: String, value: String }],
    correctAnswer: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

const questions = [
  // --- SECTION 1: SOCIAL CONVERSATION ---
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Name",
    correctAnswer: "John Wilson",
    meta: { instruction: "NO MORE THAN TWO WORDS", type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Check-in date",
    correctAnswer: "October 24th",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Number of nights",
    correctAnswer: "3",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Room type",
    correctAnswer: "Deluxe Suite",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Special requests",
    correctAnswer: "Late check-in",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Contact phone",
    correctAnswer: "0412345678",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "Hotel Booking Form - Payment method",
    correctAnswer: "Credit Card",
    meta: { type: "form" }
  },
  {
    module: "listening", phase: 1,
    text: "What time does breakfast service start?",
    correctAnswer: "7:00 AM",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 1,
    text: "Where is the swimming pool located?",
    correctAnswer: "Roof top",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 1,
    text: "Is late check-out available?",
    correctAnswer: "Yes",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 1,
    text: "What is included in the standard room rate?",
    options: [
      { text: "Breakfast only", value: "A" },
      { text: "Breakfast and dinner", value: "B" },
      { text: "All meals", value: "C" }
    ],
    correctAnswer: "Breakfast only"
  },
  {
    module: "listening", phase: 1,
    text: "How often are rooms serviced?",
    options: [
      { text: "Daily", value: "A" },
      { text: "Every two days", value: "B" },
      { text: "Only on request", value: "C" }
    ],
    correctAnswer: "Daily"
  },
  {
    module: "listening", phase: 1,
    text: "Check-out time:",
    correctAnswer: "11:00 AM",
    meta: { type: "note" }
  },
  {
    module: "listening", phase: 1,
    text: "Parking fee (per day):",
    correctAnswer: "$15",
    meta: { type: "note" }
  },
  {
    module: "listening", phase: 1,
    text: "Nearest bus stop (meters away):",
    correctAnswer: "200",
    meta: { type: "note" }
  },

  // --- SECTION 2: MONOLOGUE ---
  {
    module: "listening", phase: 2,
    text: "Map Labeling: Main entrance",
    correctAnswer: "B",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Map Labeling: Cafeteria",
    correctAnswer: "E",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Map Labeling: Library",
    correctAnswer: "G",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Map Labeling: Parking lot",
    correctAnswer: "A",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Map Labeling: Information desk",
    correctAnswer: "D",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Map Labeling: First aid room",
    correctAnswer: "C",
    meta: { instruction: "Write correct letter A-H" }
  },
  {
    module: "listening", phase: 2,
    text: "Art exhibition (Event Day)",
    correctAnswer: "Friday",
    meta: { instruction: "Choose correct letter A-F" }
  },
  {
    module: "listening", phase: 2,
    text: "Music performance (Event Day)",
    correctAnswer: "Tuesday",
    meta: { instruction: "Choose correct letter A-F" }
  },
  {
    module: "listening", phase: 2,
    text: "Guest lecture (Event Day)",
    correctAnswer: "Thursday",
    meta: { instruction: "Choose correct letter A-F" }
  },
  {
    module: "listening", phase: 2,
    text: "Workshop (Event Day)",
    correctAnswer: "Saturday",
    meta: { instruction: "Choose correct letter A-F" }
  },

  // --- SECTION 3: EDUCATIONAL CONVERSATION ---
  {
    module: "listening", phase: 3,
    text: "What is the main topic of the discussion?",
    options: [
      { text: "The impact of social media on education", value: "A" },
      { text: "The advantages of online learning", value: "B" },
      { text: "The challenges of traditional classrooms", value: "C" }
    ],
    correctAnswer: "The advantages of online learning"
  },
  {
    module: "listening", phase: 3,
    text: "What does the professor suggest about student engagement?",
    options: [
      { text: "It is higher in online courses", value: "A" },
      { text: "It depends on the teaching method", value: "B" },
      { text: "It is not measurable", value: "C" }
    ],
    correctAnswer: "It is higher in online courses"
  },
  {
    module: "listening", phase: 3,
    text: "How many students participated in the study?",
    options: [
      { text: "150", value: "A" },
      { text: "250", value: "B" },
      { text: "350", value: "C" }
    ],
    correctAnswer: "350"
  },
  {
    module: "listening", phase: 3,
    text: "The students agree that __________ is crucial.",
    correctAnswer: "Interaction",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 3,
    text: "The main disadvantage mentioned is __________.",
    correctAnswer: "Isolation",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 3,
    text: "Technical support is available __________.",
    correctAnswer: "24/7",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 3,
    text: "Flowchart step 1: Register for __________",
    correctAnswer: "Orientation",
    meta: { type: "flowchart" }
  },
  {
    module: "listening", phase: 3,
    text: "Flowchart step 2: Complete __________",
    correctAnswer: "Assessment",
    meta: { type: "flowchart" }
  },
  {
    module: "listening", phase: 3,
    text: "Flowchart step 3: Submit __________",
    correctAnswer: "Application",
    meta: { type: "flowchart" }
  },
  {
    module: "listening", phase: 3,
    text: "Flowchart step 4: Receive __________",
    correctAnswer: "Confirmation",
    meta: { type: "flowchart" }
  },
  {
    module: "listening", phase: 3,
    text: "Course duration (weeks):",
    correctAnswer: "12 weeks",
    meta: { type: "note" }
  },
  {
    module: "listening", phase: 3,
    text: "Required materials:",
    correctAnswer: "Textbooks",
    meta: { type: "note" }
  },
  {
    module: "listening", phase: 3,
    text: "Assessment method:",
    correctAnswer: "Final Exam",
    meta: { type: "note" }
  },

  // --- SECTION 4: ACADEMIC LECTURE ---
  {
    module: "listening", phase: 4,
    text: "Lecture topic: __________ development",
    correctAnswer: "Urban Development",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 4,
    text: "First observed in __________",
    correctAnswer: "ancient Mesopotamia",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 4,
    text: "Key researcher: Dr. __________",
    correctAnswer: "Janet Holloway",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 4,
    text: "Major discovery year: __________",
    correctAnswer: "1987",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 4,
    text: "Primary measurement tool: __________",
    correctAnswer: "stratigraphic analysis",
    meta: { instruction: "NO MORE THAN TWO WORDS" }
  },
  {
    module: "listening", phase: 4,
    text: "Early cities focused on (6) __________.",
    correctAnswer: "defensive walls",
    meta: { type: "summary" }
  },
  {
    module: "listening", phase: 4,
    text: "The industrial revolution introduced (7) __________.",
    correctAnswer: "factory districts",
    meta: { type: "summary" }
  },
  {
    module: "listening", phase: 4,
    text: "Modern planners prioritize (8) __________.",
    correctAnswer: "green spaces",
    meta: { type: "summary" }
  },
  {
    module: "listening", phase: 4,
    text: "Modern planners prioritize (9) __________.",
    correctAnswer: "pedestrian zones",
    meta: { type: "summary" }
  },
  {
    module: "listening", phase: 4,
    text: "Future cities must address (10) __________.",
    correctAnswer: "waste management crisis",
    meta: { type: "summary" }
  },
  {
    module: "listening", phase: 4,
    text: "What was the main limitation of early urban studies?",
    options: [
      { text: "Limited technology", value: "A" },
      { text: "Small sample sizes", value: "B" },
      { text: "Narrow focus", value: "C" }
    ],
    correctAnswer: "Narrow focus"
  },
  {
    module: "listening", phase: 4,
    text: "What factor is most important for future cities?",
    options: [
      { text: "Sustainability", value: "A" },
      { text: "Affordability", value: "B" },
      { text: "Accessibility", value: "C" }
    ],
    correctAnswer: "Sustainability"
  }
];

async function seed() {
  console.log("Starting full listening seed process...");
  try {
    const uri = (process.env.MONGODB_URI || "").replace(/^['"]|['"]$/g, '');
    if (!uri) throw new Error("MONGODB_URI is missing in .env");

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // We only delete listening questions to avoid wiping other modules
    await Question.deleteMany({ module: "listening" });
    console.log("✅ Existing listening questions cleared");

    await Question.insertMany(questions);
    console.log(`✅ ${questions.length} Listening questions added successfully!`);

    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    process.exit(1);
  }
}

seed();
