import { put } from "@vercel/blob";
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

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.ZEROHZ_READ_WRITE_TOKEN,
    });

    console.log(`Uploaded to: ${blob.url}`);
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    process.exit(1);
  }
}

upload();
