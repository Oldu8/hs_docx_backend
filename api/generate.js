const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const NAME_FILE_MAP = {
  Institutional_v250507: "Institutional_v250507.docx",
  Departmental_v250507: "Departmental_v250507.docx",
  MSA_v250321: "MSA_v250321.docx",
  SOW_v250321: "SOW_v250321.docx",
  SOW_v250609: "SOW_v250609.docx",
};

module.exports = async (req, res) => {
  const { doc_name, data } = req.body;

  const templateFilename = NAME_FILE_MAP[doc_name];

  if (!templateFilename) {
    return res.status(400).json({ error: "Unknown document type" });
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    templateFilename
  );

  let content;

  try {
    content = fs.readFileSync(templatePath, "binary");
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Template file not found", details: e.message });
  }

  try {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(data);
    doc.render();

    const buffer = doc
      .getZip()
      .generate({ type: "nodebuffer" })
      .toString("base64");

    res.send({
      success: true,
      message: "DOCX document generated",
      filename: `institution_quote_${Date.now()}.docx`,
      document: buffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Template rendering failed", details: err.message });
  }
};
