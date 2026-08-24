import express from "express";
import mongoose from "mongoose";
import { cacheConnection as redisClient } from "../config/queue.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: "Disconnected",
      redis: "Disconnected"
    }
  };

  // Check MongoDB
  if (mongoose.connection.readyState === 1) {
    health.services.mongodb = "Connected";
  } else {
    health.status = "DEGRADED";
  }

  // Check Redis
  try {
    const ping = await redisClient.ping();
    if (ping === "PONG") {
      health.services.redis = "Connected";
    } else {
      health.status = "DEGRADED";
    }
  } catch (err) {
    health.status = "DEGRADED";
  }

  const statusCode = health.status === "OK" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
