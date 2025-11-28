import { execSync } from "child_process";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const webRoot = path.resolve(__dirname, "../");

const PORT = 3001;
const TEMP_DIR = path.join(webRoot, "temp_update_test");

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

console.log("🚀 Starting Local Update Test Setup...");

try {
  // 1. Generate Keys
  console.log("\n🔑 Generating temporary keys...");
  // Check if keys already exist to avoid overwriting if run multiple times
  const keyPath = path.join(TEMP_DIR, "test.key");
  const pubKeyPath = path.join(TEMP_DIR, "test.key.pub");

  if (!fs.existsSync(keyPath)) {
    // Using tauri signer generate with password "password" for simplicity in test
    // Note: We need to run this from the src-tauri directory or root where Cargo.toml might be expected,
    // but tauri signer generate is standalone.
    // We'll use the tauri cli from node_modules
    execSync(
      `npm run tauri signer generate -- --password password --write-keys "${keyPath}"`,
      {
        cwd: projectRoot,
        stdio: "inherit",
      }
    );
  } else {
    console.log("  Using existing temporary keys.");
  }

  const pubKey = fs.readFileSync(pubKeyPath, "utf-8");
  console.log("  Public Key generated.");

  // 2. Create Dummy Artifact
  console.log("\n📦 Creating dummy update artifact...");
  const artifactName =
    process.platform === "darwin"
      ? "ZeroHz_0.3.0_universal.dmg"
      : "ZeroHz_0.3.0_x64-setup.exe";
  const artifactPath = path.join(TEMP_DIR, artifactName);
  fs.writeFileSync(artifactPath, "DUMMY CONTENT FOR TESTING UPDATE FLOW");
  console.log(`  Created ${artifactName}`);

  // 3. Sign Artifact
  console.log("\n✍️  Signing artifact...");
  // tauri signer sign -p password -k keyPath artifactPath
  const signOutput = execSync(
    `npm run tauri signer sign -- --password password --key "${keyPath}" "${artifactPath}"`,
    {
      cwd: projectRoot,
      encoding: "utf-8",
    }
  );

  // Extract signature from output or file. Tauri signer sign usually outputs the signature to stdout
  // or creates a .sig file if configured, but let's parse stdout or check for .sig file.
  // The CLI output usually looks like: "Signature: <sig>"
  // But strictly, `tauri signer sign` outputs the signature to stdout.

  // Let's try to find the signature in the output
  let signature = "";
  // Check if .sig file was created (default behavior often creates .sig)
  const sigFilePath = `${artifactPath}.sig`;
  if (fs.existsSync(sigFilePath)) {
    signature = fs.readFileSync(sigFilePath, "utf-8");
  } else {
    // Fallback to parsing stdout if needed, but usually .sig is reliable
    console.log("  Signature file not found, checking stdout...");
    const match = signOutput.match(/Signature: (.+)/);
    if (match) {
      signature = match[1].trim();
    }
  }

  if (!signature) {
    throw new Error("Could not obtain signature.");
  }
  console.log("  Artifact signed.");

  // 4. Create latest.json
  console.log("\n📄 Creating latest.json...");
  const downloadUrl = `http://localhost:${PORT}/${artifactName}`;
  const latestJson = {
    version: "0.3.0", // Newer than current 0.2.2
    notes:
      "This is a LOCAL TEST update.\n\nIt verifies that the update flow works.",
    pub_date: new Date().toISOString(),
    platforms: {
      [process.platform === "darwin" ? "darwin-universal" : "windows-x86_64"]: {
        signature: signature,
        url: downloadUrl,
      },
    },
  };

  fs.writeFileSync(
    path.join(TEMP_DIR, "latest.json"),
    JSON.stringify(latestJson, null, 2)
  );

  // 5. Serve Files
  console.log(`\n🌍 Starting local server on port ${PORT}...`);
  const server = http.createServer((req, res) => {
    const filePath = path.join(
      TEMP_DIR,
      req.url === "/" ? "index.html" : req.url
    );

    // Simple CORS for development
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
      console.log(`  Served: ${req.url}`);
    } else {
      res.writeHead(404);
      res.end("Not found");
      console.log(`  404: ${req.url}`);
    }
  });

  server.listen(PORT, () => {
    console.log("\n✅ Test Environment Ready!");
    console.log("\n👉 ACTION REQUIRED:");
    console.log("1. Open `src-tauri/tauri.conf.json`");
    console.log("2. Replace `plugins.updater.pubkey` with:");
    console.log(`   "${pubKey}"`);
    console.log("3. Replace `plugins.updater.endpoints` with:");
    console.log(`   ["http://localhost:${PORT}/latest.json"]`);
    console.log("\n4. Run `npm run tauri dev` in another terminal.");
    console.log("5. You should see the update notification appear.");
    console.log("\n(Press Ctrl+C to stop the server and cleanup)");
  });

  // Cleanup on exit
  process.on("SIGINT", () => {
    console.log("\n\n🧹 Cleaning up...");
    // Optional: delete temp dir
    // fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log("Done.");
    process.exit();
  });
} catch (error) {
  console.error("\n❌ Error:", error.message);
  // console.error(error);
}
