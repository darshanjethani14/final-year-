import mongoose from "mongoose";
import "dotenv/config";
import { User } from "./src/models/User.js";
import { OtpCode } from "./src/models/OtpCode.js";

async function clearUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const userCount = await User.countDocuments();
    const otpCount = await OtpCode.countDocuments();

    await User.deleteMany({});
    await OtpCode.deleteMany({});

    console.log(`🧹 Cleared ${userCount} users.`);
    console.log(`🧹 Cleared ${otpCount} OTP records.`);
    console.log("🚀 Database is now clean. You can start again!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error clearing database:", err);
    process.exit(1);
  }
}

clearUsers();
