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
    const isEras = props.eras_program__sync_ === "true";
    const acgme_id = props.associated_program_id__sync_ || "";
    const specialty = props.specialty || "";
    const ts_id = props.thalamus_core_id__sync_ || "";
    const cost = parseFloat(props.cost) || 0;
    const name = (props.product_name || "").toLowerCase();

    if (isEras) {
      eras_programs.push({
        count: 1,
        acgme_id,
        specialty,
        ts_id,
        v_price: cost,
        t_price: cost,
      });
    } else {
      if (!nonErasMap.has(acgme_id)) {
        nonErasMap.set(acgme_id, {
          count: 0,
          acgme_id,
          specialty,
          ts_id,
          c_price: 0,
          v_price: 0,
          t_price: 0,
        });
      }

      const entry = nonErasMap.get(acgme_id);

      entry.count += 1;

      if (name.includes("core")) {
        entry.c_price = cost;
      } else if (name.includes("video")) {
        entry.v_price = cost;
      }

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

module.exports = {
  NAME_FILE_MAP,
  splitProducts,
  getProductStats,
};
