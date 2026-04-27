import "dotenv/config";
import mongoose from "mongoose";
import { Passage } from "./src/models/Passage.js";

async function inspect() {
  const uri = (process.env.MONGODB_URI || "").replace(/^['"]|['"]$/g, '');
  await mongoose.connect(uri);
  const passages = await Passage.find({}).limit(2);
  console.log(JSON.stringify(passages, null, 2));
  await mongoose.disconnect();
}
inspect();
