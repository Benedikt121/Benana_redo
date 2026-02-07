import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("/hello", (req, res) => {
  res.json({ message: "Hello World!" });
});

const PORT = 5001;

const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

// 2. Catch-All Route: Alles was keine API ist, geht an React (index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Users: username, password, profile picture, game history (kniffel und olympiade), statistics (win/loss ratio, average score, etc.),
// maybe personal color scheme for UI and dice theme
// Kniffel: room id, game state (players, score, current player, winner, ...), game history (for statistics), chat?
// Olympiade: room id, game state (players, score, options, winner), game history (for statistics), chat?
// Authentication: JWT, sessions, or similar
