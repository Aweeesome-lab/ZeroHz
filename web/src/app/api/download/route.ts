import { NextRequest, NextResponse } from "next/server";

import { list } from "@vercel/blob";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");

  if (!platform || (platform !== "mac" && platform !== "win")) {
    return NextResponse.json(
      { error: "Invalid platform. Use 'mac' or 'win'." },
      { status: 400 }
    );
  }

  try {
    // List blobs from Vercel Blob storage
    const { blobs } = await list({
      token: process.env.ZEROHZ_READ_WRITE_TOKEN,
    });

    let downloadUrl = "";

    if (platform === "mac") {
      // Find latest .dmg file
      // Sort by uploadedAt desc to get the latest one
      const asset = blobs
        .filter((b) => b.pathname.endsWith(".dmg"))
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )[0];

      if (asset) downloadUrl = asset.url;
    } else if (platform === "win") {
      // Find latest .exe file
      const asset = blobs
        .filter((b) => b.pathname.endsWith(".exe"))
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )[0];

      if (asset) downloadUrl = asset.url;
    }

    if (downloadUrl) {
      return NextResponse.redirect(downloadUrl);
    } else {
      return NextResponse.json(
        { error: "Asset not found for the specified platform." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Download redirect error:", error);
    // Fallback to releases page
    return NextResponse.redirect(
      "https://github.com/Aweeesome-lab/ZeroHz/releases/latest"
    );
  }
}
