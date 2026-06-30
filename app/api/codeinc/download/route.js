import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const tempDir = path.join(os.tmpdir(), "codeinc-extraction");
    if (!fs.existsSync(tempDir)) {
      return NextResponse.json({ error: "No workspace files found to download." }, { status: 404 });
    }

    const zipPath = path.join(os.tmpdir(), "workspace.zip");
    
    // Clean old zip if exists
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // PowerShell command to zip all files in tempDir
    const cmd = `powershell -Command "Compress-Archive -Force -Path '${tempDir}\\*' -DestinationPath '${zipPath}'"`;

    await new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("Zip compression error:", error, stderr);
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });

    if (!fs.existsSync(zipPath)) {
      throw new Error("Zip archive was not created.");
    }

    const fileBuffer = fs.readFileSync(zipPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=workspace.zip",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
