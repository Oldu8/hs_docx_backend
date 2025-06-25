const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const generateHandler = require("./generate");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/api/generate", async (req, res) => {
  try {
    await generateHandler(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

app.get("/api/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(os.tmpdir(), filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.download(filePath, filename);
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
