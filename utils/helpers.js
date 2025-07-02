const NAME_FILE_MAP = {
  Institutional_v250507: "Institutional_v250507.docx",
  Departmental_v250507: "Departmental_v250507.docx",
  MSA_v250321: "MSA_v250321.docx",
  SOW_v250321: "SOW_v250321.docx",
  SOW_v250609: "SOW_v250609.docx",
};

function splitProducts(products) {
  const eras_programs = [];
  const nonErasMap = new Map();

  for (const product of products) {
    const props = product.properties || {};
    const isEras = props.eras_program === "true";
    const acgme_id = props.associated_program_id || "";
    const specialty = props.specialty || "";
    const ts_id = props.thalamus_core_id__sync_ || "";
    const cost = parseFloat(props.amount) || 0;
    const name = (props.product_name || "").toLowerCase();

    if (isEras) {
      eras_programs.push({
        idx: eras_programs.length + 1,
        acgme_id,
        specialty,
        ts_id,
        v_price: cost,
        t_price: cost,
      });
    } else {
      if (!nonErasMap.has(acgme_id)) {
        nonErasMap.set(acgme_id, {
          idx: nonErasMap.size + 1,
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
    }
  }

  // Format all prices after computation is complete
  eras_programs.forEach((program) => {
    program.v_price = formatNumber(program.v_price);
    program.t_price = formatNumber(program.t_price);
  });

  nonErasMap.forEach((entry) => {
    const cPriceNum = entry.c_price;
    const vPriceNum = entry.v_price;
    entry.c_price = formatNumber(cPriceNum);
    entry.v_price = formatNumber(vPriceNum);
    entry.t_price = formatNumber(cPriceNum + vPriceNum);
  });

  const non_eras_programs = Array.from(nonErasMap.values());

  return { eras_programs, non_eras_programs };
}

function getProductStats(products = []) {
  const stats = products.reduce(
    (acc, product) => {
      const { amount, eras_program } = product.properties || {};
      const numericCost = parseFloat(amount) || 0;
      const isEras = eras_program === "true";

      acc.total += numericCost;

      if (isEras) {
        acc.e_sum += numericCost;
      } else {
        acc.ne_sum += numericCost;
      }

      return acc;
    },
    {
      e_sum: 0,
      ne_sum: 0,
      total: 0,
    }
  );

  // Format all sum values after computation
  return {
    e_sum: formatNumber(stats.e_sum),
    ne_sum: formatNumber(stats.ne_sum),
    total: formatNumber(stats.total),
  };
}

function formatNumber(value) {
  if (typeof value !== "number" || isNaN(value)) {
    return "0";
  }
  return value.toLocaleString("en-US").replace(/,/g, " ");
}

function sanitizeFilename(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "_")
    .toLowerCase();
}

module.exports = {
  NAME_FILE_MAP,
  splitProducts,
  getProductStats,
  formatNumber,
  sanitizeFilename,
};
