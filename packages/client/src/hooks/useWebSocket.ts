import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useTasksStore } from "@/store/tasks.store";
import { useUIStore } from "@/store/ui.store";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "http://localhost:5000";

export const useWebSocket = (projectId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { addTask, updateTask, removeTask, moveTask } = useTasksStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token || !projectId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join:project", projectId);
    });

    socket.on("joined:project", () => {});

    socket.on("task:created", ({ task }) => {
      addTask(task);
      showToast("info", `New task: ${task.title}`);
    });

    socket.on("task:updated", ({ task }) => {
      updateTask(task._id, task);
    });

    socket.on("task:statusChanged", ({ taskId, newStatus }) => {
      moveTask(taskId, newStatus);
    });

    socket.on("task:deleted", ({ taskId }) => {
      removeTask(taskId);
    });

    socket.on("error", () => {});

    socketRef.current = socket;

    return () => {
      socket.emit("leave:project", projectId);
      socket.disconnect();
    };
  }, [projectId]);

  return socketRef.current;
};
