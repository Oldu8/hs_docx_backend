import React, { useState } from "react";
import {
  Button,
  Text,
  Stack,
  LoadingSpinner,
  hubspot,
  Flex,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, actions }) => (
  <Card
    context={context}
    sendAlert={actions.addAlert}
    fetchProperties={actions.fetchCrmObjectProperties}
    openIframeModal={actions.openIframeModal}
  />
));

const fetch_data_arr = [
  "dealname",
  "record_id",
  "recordId",
  "institution_name_sync",
  "acgme_institution_id_sync",
  "company_street_address__sync_",
  "company_zip__sync_",
  "company_state__sync_",
  "company_city__sync_",
];

const Card = ({ context, sendAlert, fetchProperties, openIframeModal }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (doc_name) => {
    setIsGenerating(true);

    try {
      const properties = await fetchProperties(fetch_data_arr);

      const response = await hubspot.serverless("generate", {
        propertiesToSend: fetch_data_arr,
        parameters: {
          userId: context.user.id,
          doc_name: doc_name,
          objectId: context?.crm?.objectId,
        },
      });

      const { url, filename } = response.body;

      const html = `
                    <html>
                      <body style="padding: 2rem; font-family: sans-serif;">
                        <h2 style="word-break: break-word; max-width: 90%;">${filename}</h2>
                        <p>You can download the file below:</p>
                        <a href="${url}" download="${filename}">
                          Click here to download
                        </a>
                      </body>
                    </html>
                  `;

      const base64Html = btoa(unescape(encodeURIComponent(html)));
      const htmlBlobUrl = `data:text/html;base64,${base64Html}`;

      openIframeModal({
        uri: htmlBlobUrl,
        width: 800,
        height: 600,
        title: "Document ready",
        flush: false,
      });
    } catch (error) {
      console.error("Error generating document:", error);
      sendAlert({
        variant: "danger",
        message: `Failed to generate document: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack direction="column" gap="medium">
      <Text variant="microcopy">
        Select what kind of document you want to generate with data from this
        deal.
      </Text>

      {isGenerating ? (
        <Stack direction="row" gap="small" align="center">
          <LoadingSpinner />
          <Text>Generating document...</Text>
        </Stack>
      ) : (
        <Flex direction={"column"} gap={"small"}>
          <Button
            variant="primary"
            onClick={() => generateDocument("MSA_v260619")}
            disabled={isGenerating}
          >
            MSA
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("MSA_SOW_v260619")}
            disabled={isGenerating}
          >
            MSA SOW
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("Institutional_v260619")}
            disabled={isGenerating}
          >
            Institution Quote
          </Button>
          <Button
            variant="primary"
            onClick={() => generateDocument("Departmental_v260619")}
            disabled={isGenerating}
          >
            Program/Dept. Quote
          </Button>
        </Flex>
      )}
    </Stack>
  );
};
