const express = require("express");
const cors = require("cors");
const generateHandler = require("./generate");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.get("/", (req, res) => res.send("Express on Vercel"));

// Add the generate endpoint
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
