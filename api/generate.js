const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
require("dotenv").config();

const { put, del } = require("@vercel/blob");
const {
  NAME_FILE_MAP,
  splitProducts,
  sanitizeFilename,
  getProductStats,
} = require("../utils/helpers");

module.exports = async (req, res) => {
  const { deal_name = "", doc_name, data } = req.body;

  const { street, city, state, zip } = data.address || {};
  const parts = [street, city, state, zip].filter(Boolean);

  const { eras_programs, non_eras_programs } = splitProducts(data.products);
  const stats = getProductStats(data.products);

  const dataForDocument = {
    institution_name: data.institution_name,
    gme_id: data.gme_id,
    customer_address: parts.join(", "),
    e_progs: eras_programs,
    ne_progs: non_eras_programs,
    ...stats,
    non_eras_count: non_eras_programs.length,
    eras_count: eras_programs.length,
    all_count: eras_programs.length + non_eras_programs.length,
  };

  // console.log("ready data:::", dataForDocument);
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

    doc.render(dataForDocument);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    const formatted_date = new Date()
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "_");

    const timestamp = Date.now();
    const validDealName = sanitizeFilename(deal_name);
    const validDocName = sanitizeFilename(doc_name);
    const outputFilename = `${validDealName}_${validDocName}_${formatted_date}_${timestamp}.docx`;
    // try {
    //   await del(outputFilename, {
    //     token: process.env.BLOB_READ_WRITE_TOKEN,
    //   });
    // } catch (err) {
    //   console.warn("No file to delete:", err.message);
    // }

    const blob = await put(outputFilename, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.send({
      success: true,
      message: "Document uploaded",
      filename: outputFilename,
      url: blob.url,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Template rendering failed", details: err.message });
  }
};
