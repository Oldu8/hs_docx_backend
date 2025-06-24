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

function splitProducts(products) {
  let countEras = 1;
  let countNonEras = 1;

  const eras_programs = [];
  const nonErasMap = new Map(); // ключ — associated_program_id__sync_

  for (const product of products) {
    const props = product.properties || {};
    const isEras = props.eras_program__sync_ === "true";
    const acgme_id = props.associated_program_id__sync_ || "";
    const specialty = props.specialty || "";
    const ts_id = props.thalamus_core_id__sync_ || "";
    const cost = parseFloat(props.cost) || 0;
    const name = (props.product_name || "").toLowerCase();

    if (isEras) {
      eras_programs.push({
        count: countEras++,
        acgme_id,
        specialty,
        ts_id,
        v_price: cost,
        t_price: cost,
      });
    } else {
      if (!nonErasMap.has(acgme_id)) {
        nonErasMap.set(acgme_id, {
          count: countNonEras++,
          acgme_id,
          specialty,
          ts_id,
          c_price: 0,
          v_price: 0,
          t_price: 0,
        });
      }

      const entry = nonErasMap.get(acgme_id);

      if (name.includes("core")) {
        entry.c_price = cost;
      } else if (name.includes("video")) {
        entry.v_price = cost;
      }

      // Всегда пересчитываем total
      entry.t_price = entry.c_price + entry.v_price;
    }
  }

  const non_eras_programs = Array.from(nonErasMap.values());

  return { eras_programs, non_eras_programs };
}

function getProductStats(products = []) {
  return products.reduce(
    (acc, product) => {
      const { cost, eras_program__sync_ } = product.properties || {};
      const numericCost = parseFloat(cost) || 0;
      const isEras = eras_program__sync_ === "true";

      acc.all_count += 1;
      acc.total += numericCost;

      if (isEras) {
        acc.e_sum += numericCost;
        acc.eras_count += 1;
      } else {
        acc.ne_sum += numericCost;
        acc.non_eras_count += 1;
      }

      return acc;
    },
    {
      e_sum: 0,
      ne_sum: 0,
      all_count: 0,
      eras_count: 0,
      non_eras_count: 0,
      total: 0,
    }
  );
}

const example_of_data = {
  institution_name: "Novant Health",
  gme_id: "369558",
  address: {
    street: "19475 Old Jetton Road, Suite 200",
    city: undefined,
    state: "NC",
    zip: "28031",
  },
  products: [
    {
      id: "27292540513",
      properties: {
        eras_program__sync_: "true",
        associated_program_id__sync_: "1394800001",
        cost: "4000",
        hs_object_id: "27292540513",
        product_name: "Thalamus Video",
        specialty: "Clinical informatics (Internal medicine)",
        thalamus_core_id__sync_: "11685",
      },
    },
  ],
};

module.exports = async (req, res) => {
  const { doc_name, data } = req.body;

  console.log(data);

  const { street, city, state, zip } = data.address || {};
  const parts = [street, city, state, zip].filter(Boolean);

  const stats = getProductStats(data.products);
  const { eras_programs, non_eras_programs } = splitProducts(data.products);

  const dataForDocument = {
    institution_name: data.institution_name,
    gme_id: data.gme_id,
    customer_address: parts.join(", "),
    eras_programs: eras_programs,
    non_eras_programs: non_eras_programs,
    ...stats,
  };

  console.log(dataForDocument);

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

    doc.setData(dataForDocument);
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
