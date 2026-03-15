import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB, disconnectDB } from "./config/db.js";
import { setupSockets } from "./sockets/index.js";

import authRoutes from "./routes/authRoutes.js";
import deleteRoutes from "./routes/deleteRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import { cronjobs } from "./services/cronjobs.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import statRoutes from "./routes/statRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.set("io", io);

setupSockets(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.SERVER_PORT || 5001;

app.use("/api/auth", authRoutes);
app.use("/api/delete", deleteRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/games", gameRoutes);
app.get("/api/health", async (req, res) => res.send("OK"));

const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get("*all", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});

cronjobs();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
