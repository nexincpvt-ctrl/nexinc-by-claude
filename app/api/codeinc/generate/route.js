import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 60;

function parseWorkspaceFiles(accumulatedText) {
  const files = {};
  const blockRegex = /```([a-zA-Z0-9+#-]+)?\n([\s\S]*?)(?:```|$)/g;
  let match;
  
  while ((match = blockRegex.exec(accumulatedText)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    const body = match[2];
    const lines = body.split("\n");
    let fileName = "";
    
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i].trim();
      const fileMatch = line.match(/(?:<!--|\/\*|\/\/|#)\s*([a-zA-Z0-9._-]+)\s*(?:-->|\*\/)?/);
      if (fileMatch) {
        fileName = fileMatch[1].trim();
        break;
      }
    }
    
    if (!fileName) {
      if (lang === "html") fileName = "index.html";
      else if (lang === "css") fileName = "style.css";
      else if (lang === "javascript" || lang === "js") fileName = "script.js";
      else if (lang === "python" || lang === "py") fileName = "main.py";
      else fileName = `code_${lang || "text"}.txt`;
    }
    
    files[fileName] = body;
  }
  
  return files;
}

export async function POST(req) {
  try {
    const { prompt, model = "meta/llama-3.3-70b-instruct" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const systemPrompt = `You are an expert frontend web development assistant.
Generate a complete working project based on the user's request.
You must output HTML, CSS, JavaScript, and any other files as separate markdown code blocks.

For every file you generate, start the code block with a comment indicating the exact file name (e.g. <!-- filename.html -->, /* filename.css */, // filename.js, # filename.py). Always use lowercase filenames.
Make sure to link styles and script files in index.html (e.g. <link rel="stylesheet" href="style.css"> and <script src="script.js"></script>) so the page functions.

Return ONLY the markdown code blocks. Do not add explanations or any other text before or after the code blocks.`;

    let apiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    let apiKey = "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";
    let providerModelId = model;

    // Route to Sakana AI if model starts with sakana/
    if (model.startsWith("sakana/")) {
      apiUrl = "https://api.sakana.ai/v1/chat/completions";
      apiKey = "fish_3c6c035b626bc738bb4de46e5ec0d79c3835de7cff0b7244c5fc8b1ab4a2f840";
      providerModelId = model.replace("sakana/", "");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: providerModelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`${model.startsWith("sakana/") ? "Sakana AI" : "NVIDIA"} API error:`, errText);
      return NextResponse.json({ error: `API error: ${response.statusText}` }, { status: 500 });
    }

    const decoder = new TextDecoder();
    let accumulatedText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Parse clean text from accumulated SSE chunks
              let cleanText = "";
              const lines = accumulatedText.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    const token = parsed.choices?.[0]?.delta?.content || "";
                    cleanText += token;
                  } catch (e) {}
                }
              }

              // Extract files dynamically
              const parsedFiles = parseWorkspaceFiles(cleanText);
              const tempDir = path.join(os.tmpdir(), "codeinc-extraction");
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
              }

              Object.keys(parsedFiles).forEach(fileName => {
                fs.writeFileSync(path.join(tempDir, fileName), parsedFiles[fileName]);
              });

              console.log(`Stream complete. ${Object.keys(parsedFiles).length} files saved to ${tempDir}`);
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("Code generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
