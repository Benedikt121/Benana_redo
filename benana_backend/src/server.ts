import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.SERVER_PORT || 5001;

const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
