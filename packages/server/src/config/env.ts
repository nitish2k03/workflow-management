import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === "default-access-secret") {
  throw new Error("JWT_ACCESS_SECRET environment variable is required and must not use default value");
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === "default-refresh-secret") {
  throw new Error("JWT_REFRESH_SECRET environment variable is required and must not use default value");
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};
