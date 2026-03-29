import { createClient } from "redis";

const redisPassword = process.env.REDIS_PASSWORD || "";
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT)
  : 6379;

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
    connectTimeout: 20000,
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 3000);
    },
  },
  password: redisPassword,
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
