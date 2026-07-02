async function postJsonRequest(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw {
        statusCode: 500,
        message: "Invalid JSON response",
      };
    }

    if (!response.ok) {
      throw {
        statusCode: response.status,
        message: parsed?.error || "Request failed",
      };
    }

    return parsed;
  } catch (err) {
    throw {
      statusCode: err.statusCode || 500,
      message: err.message || "Unexpected error",
    };
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

exports.main = async (context = {}) => {
  const { parameters = {}, propertiesToSend = {} } = context;
  const { userId = "", doc_name = "", objectId = "" } = parameters;

  const token = process.env["PRIVATE_APP_ACCESS_TOKEN"];
  const externalBackendUrl = "https://hs-docx-backend.vercel.app/api/generate";
  const thalamusProductObjectId = "2-45666582";

  try {
    /// v4 approach
    const response = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${objectId}/associations/${thalamusProductObjectId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("got response from v4 associations::", data);

    if (!Array.isArray(data?.results) || data.results.length === 0) {
      throw {
        statusCode: 400,
        message: "No associated products found for this deal.",
      };
    }

    const recordIdArr = data.results.map((item) => item.toObjectId);

    const batchSize = 99;

    const recordChunks = chunkArray(recordIdArr, batchSize);
    console.log("got this chunks::", recordChunks);
    const allProducts = [];

    for (const chunk of recordChunks) {
      const response = await fetch(
        `https://api.hubapi.com/crm/v3/objects/${thalamusProductObjectId}/batch/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            properties: [
              "product_name",
              "amount",
              "associated_program_id",
              "specialty",
              "thalamus_core_id__sync_",
              "eras_program",
            ],
            inputs: chunk.map((id) => ({ id })),
          }),
        }
      );

      const data = await response.json();
      allProducts.push(...data.results);

      await delay(300);
    }

    const dataToSend = {
      institution_name: propertiesToSend.institution_name_sync || "",
      gme_id: propertiesToSend.acgme_institution_id_sync || "",
      address: {
        street: propertiesToSend.company_street_address__sync_ || "",
        city: propertiesToSend.company_city__sync_ || "",
        state: propertiesToSend.company_state__sync_ || "",
        zip: propertiesToSend.company_zip__sync_ || "",
      },
      products: allProducts,
    };

    const name = (propertiesToSend.dealname || "")?.replace(/[\/\s]+/g, "_");

    console.log("sending data to custom backend::", {
      deal_name: name,
      doc_name,
      data: dataToSend,
    });

    const result = await postJsonRequest(externalBackendUrl, {
      deal_name: name,
      doc_name,
      data: dataToSend,
    });

    console.log("get document back from external backend::", result);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: "DOCX document generated",
        filename: result.filename,
        url: result.url,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e?.statusCode || 500,
      body: {
        success: false,
        message: e?.message || "Internal Server Error",
      },
    };
  }
};
