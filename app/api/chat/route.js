import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/supabase/queries";
import { NVIDIA_FREE_MODELS } from "@/lib/ai/nvidiaModels";

// Helper to parse potential multimodal JSON content into OpenAI standard payload format
function parseMultimodalContent(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "multimodal") {
      return [
        { type: "text", text: parsed.text },
        { type: "image_url", image_url: { url: parsed.image } }
      ];
    }
  } catch (e) {
    // Not JSON, treat as plain text
  }
  return content;
}

// Helper to check if database message content matches client prompt text
function messageContentTextMatches(dbContent, promptText) {
  if (dbContent === promptText) return true;
  try {
    const parsed = JSON.parse(dbContent);
    if (parsed && parsed.type === "multimodal" && parsed.text === promptText) {
      return true;
    }
  } catch (e) {}
  return false;
}

export async function POST(req) {
  try {
    const { sessionId, messageText, messages: clientMessages, model, image } = await req.json();

    if (!model) {
      return NextResponse.json(
        { error: "Model identifier is required." },
        { status: 400 }
      );
    }

    // Determine provider and model ID dynamically based on selected key
    let provider = "";
    let providerModelId = "";
    let mockReply = "";

    if (model === "gemini-2.5-pro") {
      provider = "openrouter";
      providerModelId = "google/gemini-2.5-pro";
    } else if (model === "custom-cloud-gpu") {
      provider = "mock";
      mockReply = "🤖 Custom Cloud GPU Model: Connected successfully! I am running on your remote GPU cluster and ready to assist you. 🚀";
    } else if (model === "my-local-model") {
      provider = "mock";
      mockReply = "🤖 My Local Model: Connected successfully! I am running on localhost:11434 via Ollama. 💻";
    } else if (model.startsWith("groq-")) {
      provider = "groq";
      providerModelId = model.replace("groq-", "");
    } else if (model.startsWith("openrouter-")) {
      provider = "openrouter";
      providerModelId = model.replace("openrouter-", "");
    } else if (model.startsWith("nvidia-")) {
      const nvidiaMatch = NVIDIA_FREE_MODELS.find((m) => m.key === model);
      if (nvidiaMatch) {
        provider = "nvidia";
        providerModelId = nvidiaMatch.providerModelId;
      }
    }

    if (!provider) {
      return NextResponse.json(
        { error: `Requested model "${model}" is unsupported or could not be mapped.` },
        { status: 400 }
      );
    }

    // 1. Handle Mock Models immediately
    if (provider === "mock") {
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: mockReply,
            },
          },
        ],
      });
    }

    // 2. Build the messages array (Prioritize DB fetching for conversation memory)
    let messages = [];
    const supabase = await createClient();

    if (sessionId) {
      try {
        const dbMessages = await getMessages(supabase, sessionId);
        messages = dbMessages.map((m) => ({
          role: m.role,
          content: parseMultimodalContent(m.content),
        }));

        // Append latest user message if not already included in fetched history (fixes race conditions)
        if (messageText) {
          const lastMsg = dbMessages[dbMessages.length - 1];
          if (!lastMsg || lastMsg.role !== "user" || !messageContentTextMatches(lastMsg.content, messageText)) {
            if (image) {
              messages.push({
                role: "user",
                content: [
                  { type: "text", text: messageText },
                  { type: "image_url", image_url: { url: image } }
                ]
              });
            } else {
              messages.push({ role: "user", content: messageText });
            }
          }
        }
      } catch (err) {
        console.error("Error loading messages from database:", err.message);
        // Fallback to client messages if DB load fails
        if (clientMessages && Array.isArray(clientMessages)) {
          messages = clientMessages.map((m) => ({
            role: m.role,
            content: parseMultimodalContent(m.content),
          }));
        }
      }
    } else if (clientMessages && Array.isArray(clientMessages)) {
      messages = clientMessages.map((m) => ({
        role: m.role,
        content: parseMultimodalContent(m.content),
      }));
    }

    if (messages.length === 0 && messageText) {
      if (image) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: messageText },
            { type: "image_url", image_url: { url: image } }
          ]
        });
      } else {
        messages.push({ role: "user", content: messageText });
      }
    }

    // Add temporary console log to verify messages array structure in the server terminal
    console.log("DEBUG: Messages being sent to AI Provider:", JSON.stringify(messages, null, 2));

    // 3. Handle Groq Provider
    if (provider === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "⚠️ GROQ_API_KEY is not configured in your `.env.local` file. Please add it to start receiving responses from Llama 3.3.",
                },
              },
            ],
          },
          { status: 200 }
        );
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API error response:", errText);
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // 4. Handle OpenRouter Provider
    if (provider === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: `⚠️ OPENROUTER_API_KEY is not configured in your \`.env.local\` file. Please add it to start receiving responses from ${model}.`,
                },
              },
            ],
          },
          { status: 200 }
        );
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NexInc",
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error response:", errText);
        throw new Error(`OpenRouter API returned status ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // 5. Handle NVIDIA Provider
    if (provider === "nvidia") {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: `⚠️ NVIDIA_API_KEY is not configured in your \`.env.local\` file. Please add it to start receiving responses from ${model}.`,
                },
              },
            ],
          },
          { status: 200 }
        );
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("NVIDIA API error response:", errText);
        throw new Error(`NVIDIA API returned status ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unsupported provider." }, { status: 400 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        choices: [
          {
            message: {
              role: "assistant",
              content: `❌ Error connecting to AI model: ${error.message}. Please check your credentials or internet connection!`,
            },
          },
        ],
      },
      { status: 200 }
    );
  }
}
