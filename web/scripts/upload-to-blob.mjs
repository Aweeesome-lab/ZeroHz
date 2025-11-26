import { put, list, del } from "@vercel/blob";
import fs from "fs";
import path from "path";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide a file path");
  process.exit(1);
}

async function upload() {
  try {
    const filename = path.basename(filePath);
    const file = fs.readFileSync(filePath);

    console.log(`Uploading ${filename} to Vercel Blob...`);

    if (!process.env.ZEROHZ_READ_WRITE_TOKEN) {
      console.error(
        "Error: ZEROHZ_READ_WRITE_TOKEN environment variable is missing!"
      );
      console.log("Available environment variables:", Object.keys(process.env));
    } else {
      console.log("ZEROHZ_READ_WRITE_TOKEN is present.");
    }

    // Check if blob exists and delete it
    const { blobs } = await list({
      token: process.env.ZEROHZ_READ_WRITE_TOKEN,
    });

    const existingBlob = blobs.find((b) => b.pathname === filename);
    if (existingBlob) {
      console.log(`Blob ${filename} already exists. Deleting...`);
      await del(existingBlob.url, {
        token: process.env.ZEROHZ_READ_WRITE_TOKEN,
      });
      console.log("Deleted existing blob.");
    }

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.ZEROHZ_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    console.log(`Uploaded to: ${blob.url}`);

    // Write URL to file for GitHub Actions to read
    fs.writeFileSync("blob-url.txt", blob.url);
    console.log("URL written to blob-url.txt");
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    process.exit(1);
  }
}

upload();
