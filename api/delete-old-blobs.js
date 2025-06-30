require("dotenv").config();

const { list, del } = require("@vercel/blob");

export default async function handler(req, res) {
  try {
    let cursor;
    let deletedCount = 0;
    let pagesProcessed = 0;

    console.log("Starting blob deletion process...");

    do {
      const listResult = await list({ cursor, limit: 1000 });

      if (listResult.blobs.length > 0) {
        const urlsToDelete = listResult.blobs.map((blob) => blob.url);
        console.log(
          `Processing page ${++pagesProcessed}: Found ${
            urlsToDelete.length
          } blobs to delete.`
        );
        await del(urlsToDelete);
        deletedCount += urlsToDelete.length;
        console.log(
          `Deleted ${urlsToDelete.length} blobs on this page. Total deleted: ${deletedCount}`
        );
      } else {
        console.log("No more blobs found.");
      }

      cursor = listResult.cursor;
    } while (cursor);

    console.log(`Successfully deleted ${deletedCount} blobs in total.`);
    return res.status(200).send(`Successfully deleted ${deletedCount} blobs.`);
  } catch (error) {
    console.error("Error deleting blobs:", error);
    return res.status(500).send(`Error deleting blobs: ${error.message}`);
  }
}
