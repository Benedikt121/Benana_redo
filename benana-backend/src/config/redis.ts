import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 20000,
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        return new Error(
          "Redis-Verbindungsfehler: Maximale Anzahl von Verbindungsversuchen erreicht",
        );
      }
      return Math.min(retries * 1000, 30000); // Exponentielles Backoff: 1s, 2s, 3s, ..., max 30s
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
