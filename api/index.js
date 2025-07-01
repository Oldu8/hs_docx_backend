const express = require("express");
const cors = require("cors");
const generateHandler = require("./generate");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("Ping:Express on Vercel"));

app.post("/api/generate", async (req, res) => {
  try {
    await generateHandler(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
