import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { prisma, connectDB, disconnectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();
connectDB();

const app = express();

const PORT = process.env.SERVER_PORT || 5001;

const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get("/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("*all", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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

