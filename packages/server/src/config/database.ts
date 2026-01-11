import mongoose from "mongoose";
import { config } from "./env";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
  } catch (error) {
    process.exit(1);
  }
};
