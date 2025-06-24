export const NAME_FILE_MAP = {
  Institutional_v250507: "Institutional_v250507.docx",
  Departmental_v250507: "Departmental_v250507.docx",
  MSA_v250321: "MSA_v250321.docx",
  SOW_v250321: "SOW_v250321.docx",
  SOW_v250609: "SOW_v250609.docx",
};

export function getProductStats(products = []) {
  return products.reduce(
    (acc, product) => {
      const { cost, eras_program__sync_ } = product.properties || {};
      const numericCost = parseFloat(cost) || 0;
      const isEras = eras_program__sync_ === "true";

      acc.all_count += 1;

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
    }
  );
}
