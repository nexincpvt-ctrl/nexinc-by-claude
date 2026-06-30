import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 60;

// Helper to scrape DuckDuckGo search results
async function searchWeb(query) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return "Search temporarily unavailable.";
    const html = await res.text();
    
    const results = [];
    const resultRegex = /<a class="result__snippet" href="([^"]+)">([\s\S]*?)<\/a>/g;
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < 4) {
      const url = match[1];
      const snippet = match[2].replace(/<[^>]*>/g, "").trim();
      results.push({ url, snippet });
    }
    
    if (results.length === 0) {
      const linkRegex = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span class="result__snippet"[^>]*>([\s\S]*?)<\/span>/g;
      while ((match = linkRegex.exec(html)) !== null && results.length < 4) {
        results.push({ url: match[1].replace(/<[^>]*>/g, "").trim(), snippet: match[2].replace(/<[^>]*>/g, "").trim() });
      }
    }
    
    if (results.length === 0) return "No design references found.";
    return results.map((r, i) => `[${i+1}] Link: ${r.url}\nSummary: ${r.snippet}`).join("\n\n");
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return "Search failed.";
  }
}

// Parse workspace files from generated markdown blocks
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

// Get API credentials based on selected model identifier
function getModelCredentials(model) {
  let apiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
  let apiKey = process.env.NVIDIA_API_KEY;
  let providerModelId = model;

  if (model.startsWith("sakana/")) {
    apiUrl = "https://api.sakana.ai/v1/chat/completions";
    apiKey = process.env.SAKANA_API_KEY || process.env.NVIDIA_API_KEY;
    providerModelId = model.replace("sakana/", "");
  } else if (model.startsWith("mimo/")) {
    apiUrl = "https://api.xiaomimimo.com/v1/chat/completions";
    apiKey = process.env.MIMO_API_KEY || process.env.NVIDIA_API_KEY;
    providerModelId = model.replace("mimo/", "");
  } else if (model.startsWith("gemini-")) {
    apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    apiKey = process.env.GEMINI_API_KEY;
    
    if (model === "gemini-2.5-pro") {
      providerModelId = "gemini-2.5-pro";
    } else if (model === "gemini-2.5-flash") {
      providerModelId = "gemini-2.5-flash";
    } else if (model === "gemini-3.5-flash") {
      providerModelId = "gemini-3.5-flash";
    } else if (model === "gemini-3.1-flash-lite") {
      providerModelId = "gemini-2.5-flash";
    } else {
      providerModelId = "gemini-2.5-flash";
    }
  } else if (model.startsWith("mistral-")) {
    apiUrl = "https://api.mistral.ai/v1/chat/completions";
    apiKey = process.env.MISTRAL_API_KEY;
    
    if (model === "mistral-large-3") {
      providerModelId = "mistral-large-latest";
    } else if (model === "mistral-medium") {
      providerModelId = "mistral-medium-latest";
    } else if (model === "mistral-small") {
      providerModelId = "mistral-small-latest";
    } else {
      providerModelId = "mistral-large-latest";
    }
  } else if (model.startsWith("openrouter/")) {
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    apiKey = process.env.OPENROUTER_API_KEY;
    providerModelId = model.replace("openrouter/", "");
  } else if (model.startsWith("groq/")) {
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    apiKey = process.env.GROQ_API_KEY;
    providerModelId = model.replace("groq/", "");
  }

  if (!apiKey) {
    throw new Error(`Missing API key for model "${model}". Please set the required environment variable in Vercel settings.`);
  }

  return { apiUrl, apiKey, providerModelId };
}

// Common function to perform non-streaming call to LLM
async function runLLMCall(model, messages, jsonMode = false) {
  const { apiUrl, apiKey, providerModelId } = getModelCredentials(model);
  const body = {
    model: providerModelId,
    messages,
    temperature: 0.1,
    max_tokens: 2048
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const getHeaders = (key) => {
    const headers = {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    };
    if (apiUrl.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "http://localhost:3000";
      headers["X-Title"] = "NexInc";
    }
    return headers;
  };

  let res = await fetch(apiUrl, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify(body)
  });


  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM Error: ${res.statusText}. Details: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Common function to stream LLM call
async function streamLLMCall(model, messages, onChunk) {
  const { apiUrl, apiKey, providerModelId } = getModelCredentials(model);
  
  const getHeaders = (key) => {
    const headers = {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    };
    if (apiUrl.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "http://localhost:3000";
      headers["X-Title"] = "NexInc";
    }
    return headers;
  };

  let res = await fetch(apiUrl, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      model: providerModelId,
      messages,
      temperature: 0.2,
      max_tokens: 4096,
      stream: true
    })
  });


  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM Stream Error: ${res.statusText}. Details: ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            onChunk(content);
          }
        } catch (e) {}
      }
    }
  }
}

export async function POST(req) {
  try {
    const { 
      action, 
      prompt, 
      selectedOption, 
      plan, 
      hiddenPrompt, 
      generatedFiles, 
      filesContext, 
      model = "meta/llama-3.3-70b-instruct", 
      managerModel = "meta/llama-3.3-70b-instruct",
      history = []
    } = await req.json();

    const encoder = new TextEncoder();

    // -------------------------------------------------------------
    // ACTION: INITIAL (Search web + generate options & questions)
    // -------------------------------------------------------------
    if (action === "initial") {
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (status, data) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, ...data })}\n\n`));
          };

          try {
            sendEvent("log", { message: "Manager Model formulating design search query..." });
            
            // 1. Ask manager for web search query
            const queryPrompt = `Based on the user request, generate a search query (max 4 words) to find design systems, CSS tricks, color schemes, or layout inspiration.
User Request: "${prompt}"
Output ONLY the search query.`;
            
            const searchQuery = await runLLMCall(managerModel, [{ role: "user", content: queryPrompt }]);
            sendEvent("log", { message: `Manager search query generated: "${searchQuery}"` });
            sendEvent("log", { message: `Running DuckDuckGo design search for: "${searchQuery}"...` });
            
            // 2. Perform DuckDuckGo search
            const searchResults = await searchWeb(searchQuery);
            sendEvent("log", { message: "Search complete. Web reference data extracted." });

            // 3. Prompt manager model to generate follow-up question, design system ideas, and 3 options
            sendEvent("log", { message: "Analyzing search references and designing follow-up choices..." });
            
            const managerSystemPrompt = `You are NexInc Project Manager & Design System Planner.
Analyze the user request and the web design references.
Generate:
1. A follow-up clarification question (e.g. style choice, main colors, grid system).
2. Exactly 3 suggested selection options.
3. A design system concept.

You MUST respond ONLY with a JSON object in this format:
{
  "followUp": "Clarification question or style check text...",
  "options": [
    "Option 1 description (details on colors, style)",
    "Option 2 description (details on colors, style)",
    "Option 3 description (details on colors, style)"
  ],
  "designSystem": "Brief description of the design system components, layout, and colors..."
}`;

            const userContent = `User Request: "${prompt}"
Existing Files Context:\n${filesContext || "No files"}

Web references for inspiration:
${searchResults}`;

            const optionsJSONStr = await runLLMCall(managerModel, [
              { role: "system", content: managerSystemPrompt },
              { role: "user", content: userContent }
            ], true);

            try {
              const parsedOptions = JSON.parse(optionsJSONStr);
              sendEvent("options", parsedOptions);
            } catch (err) {
              // Fallback if not valid JSON
              sendEvent("options", {
                followUp: "Choose a design theme style:",
                options: [
                  "Vibrant Modern Glassmorphism (bright gradients, frosted panel cards)",
                  "Minimalist Professional (high contrast dark theme, mono fonts)",
                  "Playful Creative (warm pastel palette, floating cards)"
                ],
                designSystem: "Responsive Flex/Grid, modern CSS variables."
              });
            }

            sendEvent("log", { message: "Options generated successfully! Awaiting your input." });
            controller.close();
          } catch (err) {
            sendEvent("error", { message: err.message });
            controller.close();
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
    }

    // -------------------------------------------------------------
    // ACTION: PLAN (Create markdown plan & hidden prompt)
    // -------------------------------------------------------------
    if (action === "plan") {
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (status, data) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, ...data })}\n\n`));
          };

          try {
            sendEvent("log", { message: `Analyzing selected theme choice: "${selectedOption}"` });
            sendEvent("log", { message: "Formulating file structural plan and coding directives..." });

            const managerSystemPrompt = `You are NexInc Project Manager & Reasoning Agent.
Generate:
1. A detailed markdown Implementation Plan outlining which files will be created/modified, layout choices, and color variables.
2. A hidden instruction prompt for the coding assistant. It must describe exactly how the HTML structure, CSS rules, and JS interactions should be coded. Start the instruction section with '[CODING_INSTRUCTIONS]' and output it at the end. Make sure the instruction prompt is detailed.

CRITICAL INCREMENTAL WORKFLOW:
- Always look at the 'Current Files Context'.
- DO NOT recreate, delete, or rewrite existing files from scratch unless explicitly requested by the user.
- If files exist, your plan must perform INCREMENTAL modifications. Describe exactly which files will be modified and specify only the necessary additions or updates.
- Keep the design system, colors, layout, and previous work intact. Only add or edit files to satisfy the new user request.

Write your response now.`;

            const userContent = `Original User Request: "${prompt}"
Selected Design Choice: "${selectedOption}"
Current Files Context:\n${filesContext || "No files"}`;

            let accumulatedPlan = "";
            await streamLLMCall(managerModel, [
              { role: "system", content: managerSystemPrompt },
              { role: "user", content: userContent }
            ], (chunk) => {
              accumulatedPlan += chunk;
              sendEvent("plan_chunk", { token: chunk });
            });

            // Parse plan and hidden prompt
            let planText = accumulatedPlan;
            let hiddenPromptText = "";
            const splitIdx = accumulatedPlan.indexOf("[CODING_INSTRUCTIONS]");
            if (splitIdx !== -1) {
              planText = accumulatedPlan.slice(0, splitIdx).trim();
              hiddenPromptText = accumulatedPlan.slice(splitIdx + "[CODING_INSTRUCTIONS]".length).trim();
            } else {
              hiddenPromptText = `Generate HTML, CSS, JS files to implement: ${prompt} with style details: ${selectedOption}. Make sure the code matches the user request.`;
            }

            sendEvent("plan_ready", { plan: planText, hiddenPrompt: hiddenPromptText });
            sendEvent("log", { message: "Implementation Plan created. Ready for code generation!" });
            controller.close();
          } catch (err) {
            sendEvent("error", { message: err.message });
            controller.close();
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
    }

    // -------------------------------------------------------------
    // ACTION: CODE (Stream actual code generation)
    // -------------------------------------------------------------
    if (action === "code") {
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (status, data) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, ...data })}\n\n`));
          };

          try {
            sendEvent("log", { message: "Coding Model starting code generation..." });
            
            const codingSystemPrompt = `You are an expert frontend developer coding assistant.
Your sole job is to output code blocks (HTML, CSS, JS, etc.) as separate markdown code blocks.
For every file you generate, start the code block with a comment indicating the exact file name (e.g. <!-- filename.html -->, /* filename.css */, // filename.js). Always use lowercase filenames.
Make sure to link styles and script files in index.html (e.g. <link rel="stylesheet" href="style.css"> and <script src="script.js"></script>) so the page functions.

Strict Constraints:
1. INCREMENTAL CODING: Always inspect the 'existing files in the workspace'. DO NOT rewrite them from scratch. Maintain the existing styling, layout, files, and functionalities. Only modify the specific parts needed or add new files to support the new features.
2. NO EXTRA FILES: Do NOT create any extra or unannounced files. Only output the files explicitly outlined in the Project Manager's design plan.
3. EXACT ID & CLASS MATCHING: You must ensure that all IDs and class names created in the HTML are exactly matched and used in the CSS stylesheets and Javascript files. Double-check spelling and selector syntax (e.g. '#my-id' for IDs, '.my-class' for classes) so styles apply correctly.
4. FOLDER CREATION: To create empty folders, output a file block with the path ending in a slash (e.g. 'components/') or ending in '/.keep' (e.g. 'components/.keep') with '/* folder placeholder */' as content. Nested paths (e.g. 'styles/main.css') will also implicitly create their parent directories.
5. NO INLINING / SEPARATE FILES REQUIRED: Do NOT combine CSS styles inside '<style>' tags or Javascript inside '<script>' tags in the HTML if the Project Manager's plan specifies separate files (e.g. 'style.css', 'script.js'). You MUST write them as separate files in their own markdown code blocks, and link them using '<link rel="stylesheet" href="style.css">' and '<script src="script.js"></script>' in the HTML.

You can perform the following operations:
1. CREATE OR MODIFY FILES: Simply output a standard code block starting with the file comment name (e.g. // script.js).
2. DELETE FILES: Output the file comment name followed immediately by the keyword "delete" or "// DELETE" inside the block.
3. RENAME FILES: Output the file comment name followed immediately by a rename directive "rename to <new_path>".

Return ONLY the markdown code blocks. Do not add chat explanations or any other text before or after the code blocks.`;

            const userContent = `Here are the existing files in the workspace:\n\n${filesContext || "No files"}\n\nHere is the Project Manager's design plan:\n${plan}\n\nCoding Directives:\n${hiddenPrompt}\n\nPlease generate the required files.`;

            await streamLLMCall(model, [
              { role: "system", content: codingSystemPrompt },
              { role: "user", content: userContent }
            ], (chunk) => {
              sendEvent("code_chunk", { token: chunk });
            });

            sendEvent("log", { message: "Coding Model generated code blocks. Handing over to QA..." });
            controller.close();
          } catch (err) {
            sendEvent("error", { message: err.message });
            controller.close();
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
    }

    // -------------------------------------------------------------
    // ACTION: QA (Critique, check for errors, run refinement loop)
    // -------------------------------------------------------------
    if (action === "qa") {
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (status, data) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, ...data })}\n\n`));
          };

          try {
            sendEvent("log", { message: "Manager Model starting Quality Assurance review..." });
            sendEvent("log", { message: "Checking for broken linkages, syntax validation, and design harmony..." });

            const managerSystemPrompt = `You are NexInc Project Manager & QA Auditor.
Analyze the generated files for the user prompt. Think like a human review expert:
- Is the design aesthetically premium? Would the user be satisfied?
- Are the style/script references aligned?
- Are there unclosed HTML tags or JS script errors?
- STRICT SELECTOR CHECK: Check that all HTML element IDs (id="...") and class names (class="...") match exactly with the selectors used in CSS (e.g. #my-id, .my-class) and JS (e.g. document.getElementById('my-id')). If there are discrepancies or typos, reject the design.
- STICT FILE CHECK: Check that no extra or unannounced files were created. Only allow files declared in the approved Implementation Plan.
- FILE STRUCTURE MATCH CHECK: Verify that all files proposed in the Implementation Plan were actually generated as separate files. If the plan specifies separate files (e.g. style.css, script.js), but the coder lazy-inlined the CSS/JS code inside index.html and failed to output the separate files, reject the code and output '[CORRECTIONS_NEEDED]' demanding that they split the files into their separate code blocks.

Provide your detailed critique.
If there are NO errors and the design is premium/satisfying, output 'STATUS: SATISFIED' at the end.
If there are errors or features missing, list them clearly, and output '[CORRECTIONS_NEEDED]' followed by specific code instructions or correction directives.`;

            const userContent = `User Request: "${prompt}"
Implementation Plan:\n${plan}

Here are the generated workspace files:\n${generatedFiles}

Conduct your review and output your critique.`;

            let accumulatedCritique = "";
            await streamLLMCall(managerModel, [
              { role: "system", content: managerSystemPrompt },
              { role: "user", content: userContent }
            ], (chunk) => {
              accumulatedCritique += chunk;
              sendEvent("qa_chunk", { token: chunk });
            });

            // Check if corrections are needed
            if (accumulatedCritique.includes("[CORRECTIONS_NEEDED]")) {
              sendEvent("log", { message: "Critique complete: Issues found. Starting refinement loop..." });
              
              const correctionIndex = accumulatedCritique.indexOf("[CORRECTIONS_NEEDED]");
              const correctionsInstructions = accumulatedCritique.slice(correctionIndex + "[CORRECTIONS_NEEDED]".length).trim();

              sendEvent("log", { message: "Coding Model processing corrections..." });
              
              const codingSystemPrompt = `You are an expert frontend developer coding assistant.
Review the critique from the Project Manager and update the files.
Output updated code files in markdown blocks starting with a comment for the file name. Only return markdown blocks.`;

              const codingCorrectionUserContent = `Here are the current files:\n${generatedFiles}\n\nHere are the correction directives:\n${correctionsInstructions}\n\nPlease output the corrected files.`;

              let accumulatedCorrectedCode = "";
              await streamLLMCall(model, [
                { role: "system", content: codingSystemPrompt },
                { role: "user", content: codingCorrectionUserContent }
              ], (chunk) => {
                accumulatedCorrectedCode += chunk;
                sendEvent("code_chunk", { token: chunk }); // Client treats this as code tokens to update files
              });

              // Second Review (Quick check)
              sendEvent("log", { message: "Refinement complete. Final verification..." });
              
              const finalReviewPrompt = `You are NexInc Project Manager. Review the final corrected files.
Generated Files:\n${accumulatedCorrectedCode || generatedFiles}
Output a short final review conclusion and end with 'STATUS: SATISFIED'.`;

              let finalCritique = "";
              await streamLLMCall(managerModel, [
                { role: "system", content: finalReviewPrompt },
                { role: "user", content: "Review final changes." }
              ], (chunk) => {
                finalCritique += chunk;
                sendEvent("qa_chunk", { token: chunk });
              });
            }

            sendEvent("log", { message: "QA Verification Complete! Workspace fully synced." });
            sendEvent("complete", { message: "Process finished successfully." });
            controller.close();
          } catch (err) {
            sendEvent("error", { message: err.message });
            controller.close();
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
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  } catch (error) {
    console.error("Code generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
