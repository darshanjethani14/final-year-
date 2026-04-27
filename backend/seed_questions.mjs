import "dotenv/config";
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    text: { type: String, required: true },
    options: [{ text: String, value: String }],
    correctAnswer: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

const questions = [
  {
    module: "reading",
    text: "According to the passage, what is the primary cause of climate change?",
    options: [
      { text: "Greenhouse gas emissions", value: "A" },
      { text: "Solar flares", value: "B" },
      { text: "Volcanic activity", value: "C" },
      { text: "None of the above", value: "D" }
    ],
    correctAnswer: "Greenhouse gas emissions"
  },
  {
    module: "reading",
    text: "Renewable energy sources like solar and wind are becoming more _______ (fill in the blank).",
    correctAnswer: "affordable"
  },
  {
    module: "listening",
    text: "What time does the train depart?",
    options: [
      { text: "10:30 AM", value: "A" },
      { text: "11:00 AM", value: "B" },
      { text: "11:30 AM", value: "C" },
      { text: "12:00 PM", value: "D" }
    ],
    correctAnswer: "10:30 AM"
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 1,
      part1: ["Do you often use technology in your daily life?", "What kind of apps do you use the most?", "Has technology changed your routine?"],
      part2: "Describe a technological device you use every day.",
      part3: ["Do you think people rely too much on technology today?", "How has technology changed communication?", "Should schools limit digital devices?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 2,
      part1: ["Do you like spending time with friends?", "How often do you meet your close friends?", "What do you usually do together?"],
      part2: "Describe a close friend of yours.",
      part3: ["Is friendship different for children and adults?", "Do social media help maintain friendships?", "Why do some friendships last longer?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 3,
      part1: ["What subject did you enjoy at school?", "Do you prefer studying alone or in groups?", "Are you learning something new?"],
      part2: "Describe something new you learned recently.",
      part3: ["How has education changed recently?", "Is online learning better than classroom learning?", "Should education focus on practical skills?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 4,
      part1: ["What do you do in your free time?", "Do you prefer indoor or outdoor activities?", "Did you have hobbies as a child?"],
      part2: "Describe a hobby you enjoy.",
      part3: ["Why are hobbies important?", "Do people have less free time now?", "Should hobbies be taught in schools?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 5,
      part1: ["Are you working or studying?", "What job would you like in the future?", "Is job satisfaction important?"],
      part2: "Describe a job you would like to have.",
      part3: ["How has technology changed workplaces?", "Is salary more important than job satisfaction?", "Should young people change jobs often?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 6,
      part1: ["Do you like travelling?", "How often do you visit new places?", "Do you travel alone or with others?"],
      part2: "Describe a place you would like to visit.",
      part3: ["Why do people like travelling?", "How does tourism affect communities?", "Should governments promote tourism?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 7,
      part1: ["Do you use social media?", "Which platform do you use most?", "Do you prefer texting or calling?"],
      part2: "Describe a time you used technology to communicate.",
      part3: ["Has technology improved communication?", "Are face-to-face conversations still important?", "How might communication change?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 8,
      part1: ["Do you try to stay healthy?", "What exercise do you do?", "Do you prefer healthy food?"],
      part2: "Describe a healthy habit you have.",
      part3: ["Why is healthy lifestyle important?", "Should governments promote healthy habits?", "Is modern life less healthy?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 9,
      part1: ["Do you enjoy reading books?", "What kind of books do you prefer?", "Did you read more as a child?"],
      part2: "Describe a book you enjoyed reading.",
      part3: ["Do people read less nowadays?", "Are digital books better?", "Should children read more?"]
    }
  },
  {
    module: "speaking",
    text: "speaking_test_data",
    meta: {
      type: "speaking_test", id: 10,
      part1: ["Are you interested in new technology?", "Do you follow tech news?", "What technology do you use daily?"],
      part2: "Describe a technology that will change the future.",
      part3: ["Will AI replace jobs?", "Is technology making life easier?", "Should technology be controlled?"]
    }
  },

  // WRITING QUESTIONS
  {
    module: "writing", text: "Describe the advantages and disadvantages of using public transportation in large cities.",
    meta: { taskNumber: 1, id: "T1_001", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Discuss the importance of learning English for students in non-English speaking countries.",
    meta: { taskNumber: 1, id: "T1_002", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Explain how technology has changed the way people communicate with each other.",
    meta: { taskNumber: 1, id: "T1_003", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Discuss the benefits of regular exercise for young people.",
    meta: { taskNumber: 1, id: "T1_004", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Describe the impact of social media on students’ academic performance.",
    meta: { taskNumber: 1, id: "T1_005", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Discuss the advantages of living in a small town compared to a big city.",
    meta: { taskNumber: 1, id: "T1_006", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Explain why teamwork is important in the workplace.",
    meta: { taskNumber: 1, id: "T1_007", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Discuss the role of teachers in motivating students to learn.",
    meta: { taskNumber: 1, id: "T1_008", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Describe the benefits of reading books regularly.",
    meta: { taskNumber: 1, id: "T1_009", wordLimit: "150-200" }
  },
  {
    module: "writing", text: "Discuss the effects of online shopping on traditional stores.",
    meta: { taskNumber: 1, id: "T1_010", wordLimit: "150-200" }
  },

  // TASK 2
  {
    module: "writing", text: "Some people believe that technology makes life easier, while others think it creates more problems. Discuss both views and give your opinion.",
    meta: { taskNumber: 2, id: "T2_001", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Many people believe that students should learn practical skills at school. Others think academic subjects are more important. Discuss both views and give your opinion.",
    meta: { taskNumber: 2, id: "T2_002", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Online education is becoming more common. Do the advantages outweigh the disadvantages?",
    meta: { taskNumber: 2, id: "T2_003", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Some people think governments should spend more money on public transport, while others believe building roads is more important. Discuss both views.",
    meta: { taskNumber: 2, id: "T2_004", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Many people believe that social media has a negative effect on society. To what extent do you agree or disagree?",
    meta: { taskNumber: 2, id: "T2_005", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Some people prefer living in cities, while others prefer living in rural areas. Discuss both views and give your opinion.",
    meta: { taskNumber: 2, id: "T2_006", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "The use of smartphones among children is increasing. What are the advantages and disadvantages of this trend?",
    meta: { taskNumber: 2, id: "T2_007", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Some people think university education should be free for everyone. Others believe students should pay for their education. Discuss both views.",
    meta: { taskNumber: 2, id: "T2_008", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Working from home is becoming more popular. Do you think this is a positive or negative development?",
    meta: { taskNumber: 2, id: "T2_009", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Some people believe that competition is good for children, while others think cooperation is better. Discuss both views and give your opinion.",
    meta: { taskNumber: 2, id: "T2_010", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Environmental problems are increasing worldwide. What are the causes and what solutions can be implemented?",
    meta: { taskNumber: 2, id: "T2_011", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Some people believe that advertisements influence people’s choices. Others think people are not affected. Discuss both views.",
    meta: { taskNumber: 2, id: "T2_012", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "Schools should focus on academic success and passing examinations. Skills such as cookery, dressmaking and woodwork should not be taught at school as it is better to learn these from family and friends. To what extent do you agree or disagree?",
    meta: { taskNumber: 2, id: "T2_013", wordLimit: "250-300" }
  },
  {
    module: "writing", text: "The best way to teach children to cooperate is through team sports at school. To what extent do you agree or disagree?",
    meta: { taskNumber: 2, id: "T2_014", wordLimit: "250-300" }
  }
];

async function seed() {
  console.log("Starting seed process...");
  try {
    const uri = (process.env.MONGODB_URI || "").replace(/^['"]|['"]$/g, '');
    if (!uri) throw new Error("MONGODB_URI is missing in .env");

    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    await Question.deleteMany({});
    console.log("✅ Existing questions cleared");

    await Question.insertMany(questions);
    console.log("✅ Sample questions added successfully!");

    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    process.exit(1);
  }
}

seed();
