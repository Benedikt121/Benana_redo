import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import deleteRoutes from "./routes/deleteRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import { cronjobs } from "./services/cronjobs.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.SERVER_PORT || 5001;

app.use("/api/auth", authRoutes);
app.use("/api/delete", deleteRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/users", userRoutes);
app.get("/api/health", async (req, res) => res.send("OK"));

const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get("*all", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

cronjobs();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
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
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
