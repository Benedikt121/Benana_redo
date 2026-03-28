import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 20000,
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () =>
  console.log("✅ Erfolgreich mit Redis verbunden"),
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
