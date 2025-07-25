import { Server as SocketIOServer } from "socket.io";

import { CustomError } from "../utils/customError";
import { logger } from "../utils/logger";

let io: SocketIOServer | null = null;

export const setSocketServerInstance = (server: SocketIOServer) => {
  io = server;
  logger.info("[socket.ts] Socket.io instance has been set.");
};

export const getSocketServerInstance = (): SocketIOServer => {
  if (!io) {
    logger.error(
      "[socket.ts] Attempted to access Socket.io instance before initialization."
    );
    throw new CustomError("Socket.io instance not initialized yet.");
  }

  logger.info("[socket.ts] Socket.io instance retrieved successfully.");
  
  return io;
};
