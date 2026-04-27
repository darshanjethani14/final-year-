import mongoose from "mongoose";

export async function connectDB(retries = 5) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const cleanUri = uri.replace(/^"|"$/g, '');

  while (retries) {
    try {
      await mongoose.connect(cleanUri, {
        serverSelectionTimeoutMS: 30000,
        family: 4 
      });
      console.log("✅ MongoDB connected successfully");
      return;
    } catch (err) {
      console.warn(`⚠️ MongoDB connection failed. Retries left: ${retries - 1}`);
      retries -= 1;
      if (retries === 0) throw err;
      // Wait 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

