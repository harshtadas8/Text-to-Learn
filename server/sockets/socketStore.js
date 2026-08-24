import { logger } from "../config/logger.js";

let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
};

export const getIo = () => {
  if (!ioInstance) {
    logger.warn("[socketStore] IO instance not initialized yet!");
  }
  return ioInstance;
};

