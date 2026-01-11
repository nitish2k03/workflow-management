import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/jwt.utils";
import { Project } from "../models/project.model";
import { config } from "../config/env";

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

let io: Server;

export const initializeWebSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = decoded.userId;
      (socket as AuthenticatedSocket).userEmail = decoded.email;

      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (baseSocket) => {
    const socket = baseSocket as AuthenticatedSocket;

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    socket.on("join:project", async (projectId: string) => {
      try {
        const userObjectId = new mongoose.Types.ObjectId(socket.userId);
        const hasAccess = await Project.exists({
          _id: projectId,
          $or: [{ owner: userObjectId }, { members: userObjectId }],
        });

        if (hasAccess) {
          socket.join(`project:${projectId}`);
          socket.emit("joined:project", { projectId });
        } else {
          socket.emit("error", { message: "Access denied to project" });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to join project room" });
      }
    });

    socket.on("leave:project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
};

export const getIO = () => io;

// Emit to project room
export const emitToProject = (
  projectId: string,
  event: string,
  data: unknown
) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

// Emit to user
export const emitToUser = (userId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
