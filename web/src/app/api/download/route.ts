import { NextRequest, NextResponse } from "next/server";

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

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
    const response = await fetch(
      "https://api.github.com/repos/Aweeesome-lab/ZeroHz/releases/latest",
      {
        headers: {
          "User-Agent": "ZeroHz-Web",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch releases");
    }

    const data = await response.json();
    const assets: GitHubReleaseAsset[] = data.assets;

    let downloadUrl = "";

    if (platform === "mac") {
      // Find .dmg file
      const asset = assets.find((a) => a.name.endsWith(".dmg"));
      if (asset) downloadUrl = asset.browser_download_url;
    } else if (platform === "win") {
      // Find .exe file (setup.exe)
      const asset = assets.find((a) => a.name.endsWith(".exe"));
      if (asset) downloadUrl = asset.browser_download_url;
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
