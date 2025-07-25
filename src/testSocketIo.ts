// src/testSocketIo.ts
import { io } from "socket.io-client";
import { logger } from "./utils/logger";

const SOCKET_URL = "http://localhost:3000"; // or your backend's Docker IP if needed

const userId = "test123"; // Simulate user ID

const socket = io(SOCKET_URL, {
  query: { userId },
  transports: ["websocket"], // Force WebSocket for stability
});

socket.on("connect", () => {
  logger.info(`[testSocketIo.ts] Connected with ID: ${socket.id}`);
});

socket.on("disconnect", () => {
  logger.info("[testSocketIo.ts] Disconnected from server");
});

socket.on("connect_error", (err) => {
  logger.error("[testSocketIo.ts] Connection error:", err.message);
});
