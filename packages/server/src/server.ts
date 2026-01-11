import { createServer } from "http";
import app from "./app";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeWebSocket } from "./websocket";

const startServer = async () => {
  try {
    await connectDatabase();

    const httpServer = createServer(app);
    initializeWebSocket(httpServer);

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
