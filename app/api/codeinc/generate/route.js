import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { prompt, model = "meta/llama-3.3-70b-instruct" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const systemPrompt = `You are an expert frontend web development assistant.
Generate a complete working web page based on the user's request.
You must output HTML, CSS, and JavaScript as separate, standalone code blocks.

Use the following exact markdown formats:
\`\`\`html
<!-- index.html -->
...
\`\`\`

\`\`\`css
/* style.css */
...
\`\`\`

\`\`\`javascript
// script.js
...
\`\`\`

The index.html MUST link style.css via <link rel="stylesheet" href="style.css"> and script.js via <script src="script.js"></script> so they are fully integrated.
Return ONLY these three markdown code blocks. Do not add explanations or any other text before or after the code blocks.`;

    const apiKey = "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";
    
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
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
      console.error("NVIDIA API error:", errText);
      return NextResponse.json({ error: `NVIDIA API error: ${response.statusText}` }, { status: 500 });
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

              // Extract files
              const htmlRegex = /```html\n([\s\S]*?)(?:```|$)/i;
              const htmlMatch = cleanText.match(htmlRegex);
              let htmlCode = htmlMatch ? htmlMatch[1] : "";

              const cssRegex = /```css\n([\s\S]*?)(?:```|$)/i;
              const cssMatch = cleanText.match(cssRegex);
              let cssCode = cssMatch ? cssMatch[1] : "";

              const jsRegex = /```(?:javascript|js)\n([\s\S]*?)(?:```|$)/i;
              const jsMatch = cleanText.match(jsRegex);
              let jsCode = jsMatch ? jsMatch[1] : "";

              if (!htmlCode && !cssCode && !jsCode) {
                htmlCode = cleanText;
              }

              // Save temp files for code extraction
              const tempDir = path.join(os.tmpdir(), "codeinc-extraction");
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
              }

              fs.writeFileSync(path.join(tempDir, "index.html"), htmlCode);
              fs.writeFileSync(path.join(tempDir, "style.css"), cssCode);
              fs.writeFileSync(path.join(tempDir, "script.js"), jsCode);

              console.log(`Stream complete. Temp files saved to ${tempDir}`);
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
