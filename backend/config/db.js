import mongoose from "mongoose";
import dotenv from "dotenv";
import { winstonLogger } from "./logger.js";

dotenv.config();

const connectDB = async () => {
  try {
    const DB_URI = process.env.MONGO_URI;

    await mongoose.connect(DB_URI);
    winstonLogger.info("MongoDB connected successfully");

  } catch (error) {
    winstonLogger.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;