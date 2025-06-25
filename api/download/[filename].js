const fs = require("fs");
const path = require("path");

export default function handler(req, res) {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).send("Filename is required");
  }

  const filePath = path.join("/tmp", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const fileStream = fs.createReadStream(filePath);

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  fileStream.pipe(res);
}
