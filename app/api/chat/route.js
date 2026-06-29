import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/supabase/queries";
import { NVIDIA_FREE_MODELS } from "@/lib/ai/nvidiaModels";
import { isVisionCapable } from "@/lib/ai/modelTags";

export const maxDuration = 60;

// Helper to format database history messages for vision/multimodal endpoints
function formatVisionMessages(dbMessages) {
  return dbMessages.map((m) => {
    if (m.message_type === "image" && m.role === "user") {
      return {
        role: m.role,
        content: [
          { type: "text", text: m.content || "Describe this image" },
          { type: "image_url", image_url: { url: m.image_url } }
        ]
      };
    }
    return {
      role: m.role,
      content: m.content
    };
  });
}

// Helper to format database history messages for Anthropic Messages API
function formatAnthropicMessages(dbMessages) {
  return dbMessages.map((m) => {
    if (m.role === "system") {
      return null;
    }
    
    let content = m.content;
    if (m.message_type === "image" && m.role === "user") {
      const match = m.image_url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mediaType = match[1];
        const base64Data = match[2];
        content = [
          { type: "text", text: m.content || "Describe this image" },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data
            }
          }
        ];
      }
    }
    return {
      role: m.role,
      content: content
    };
  }).filter(Boolean);
}

const supportsReasoningEffort = (modelId) => {
  const id = modelId.toLowerCase();
  if (id.includes("o1-mini") || id.includes("o1-preview")) return false;
  return id.startsWith("o1") || id.startsWith("o3-mini");
};

export async function POST(req) {
  try {
    const { sessionId, messageText, messages: clientMessages, model, imageUrl, reasoningEffort } = await req.json();

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

    // Map curated custom free models to their real provider endpoints
    if (model === "gpt-oss-120b") {
      provider = "groq";
      providerModelId = "llama-3.3-70b-versatile";
    } else if (model === "zai-glm-4.7") {
      provider = "groq";
      providerModelId = "llama-3.3-70b-versatile";
    } else if (model.includes("gpt-oss-120b")) {
      provider = "groq";
      providerModelId = "llama-3.3-70b-versatile";
    } else if (model.includes("llama-3.3-70b")) {
      provider = "groq";
      providerModelId = "llama-3.3-70b-versatile";
    } else if (model.includes("qwen3-next-80b")) {
      provider = "groq";
      providerModelId = "qwen-2.5-coder-32b";
    } else if (model.includes("nemotron-3-ultra")) {
      provider = "nvidia";
      providerModelId = "nvidia/nemotron-3-ultra-550b-a55b";
    } else if (model === "cohere-north-mini-code") {
      provider = "mistral";
      providerModelId = "codestral-latest";
    } else if (model === "llama-3.1-8b-instant") {
      provider = "groq";
      providerModelId = "llama-3.1-8b-instant";
    } else if (model === "nemotron-mini-4b") {
      provider = "nvidia";
      providerModelId = "nvidia/nemotron-mini-4b-instruct";
    } else if (model === "gpt-oss-20b") {
      provider = "groq";
      providerModelId = "llama-3.3-70b-versatile";
    } else if (model.includes("gemma-4-")) {
      provider = "groq";
      providerModelId = "gemma2-9b-it";
    } else if (model.startsWith("gemini-") || model.startsWith("gemini-live-")) {
      provider = "gemini";
      providerModelId = model.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
    } else if (model === "gpt-4o") {
      provider = "openai";
      providerModelId = "gpt-4o";
    } else if (model === "o1") {
      provider = "openai";
      providerModelId = "o1";
    } else if (model === "o3-mini") {
      provider = "openai";
      providerModelId = "o3-mini";
    } else if (model === "gpt-5.5" || model === "gpt-5.5-pro" || model === "gpt-5.4" || model === "gpt-5.4-pro") {
      provider = "openai";
      providerModelId = "gpt-4o";
    } else if (model === "gpt-5.4-mini" || model === "gpt-5.4-nano") {
      provider = "openai";
      providerModelId = "gpt-4o-mini";
    } else if (model === "claude-3.5-sonnet") {
      provider = "anthropic";
      providerModelId = "claude-3-5-sonnet-latest";
    } else if (model === "perplexity-sonar") {
      provider = "perplexity";
      providerModelId = "sonar";
    } else if (model === "deepseek-r1") {
      provider = "deepseek";
      providerModelId = "deepseek-reasoner";
    } else if (
      model.startsWith("mistral-") ||
      model.startsWith("magistral-") ||
      model.startsWith("codestral") ||
      model.startsWith("devstral") ||
      model.startsWith("pixtral") ||
      model.startsWith("voxtral") ||
      model.startsWith("ministral")
    ) {
      provider = "mistral";
      if (model === "mistral-large" || model === "mistral-large-3") {
        providerModelId = "mistral-large-latest";
      } else if (model === "mistral-medium-3.5" || model === "magistral-medium" || model === "magistral-small") {
        providerModelId = "mistral-medium-latest";
      } else if (model === "mistral-small" || model === "mistral-small-4" || model.startsWith("voxtral")) {
        providerModelId = "mistral-small-latest";
      } else if (model.startsWith("codestral") || model.startsWith("devstral")) {
        providerModelId = "codestral-latest";
      } else if (model.startsWith("pixtral")) {
        providerModelId = "pixtral-12b";
      } else if (model === "ministral-3b") {
        providerModelId = "ministral-3b-latest";
      } else if (model === "ministral-8b" || model === "ministral-14b") {
        providerModelId = "ministral-8b-latest";
      } else {
        providerModelId = "mistral-small-latest";
      }
    } else if (model === "custom-cloud-gpu") {
      provider = "mock";
      mockReply = "🤖 Custom Cloud GPU Model: Connected successfully! I am running on your remote GPU cluster and ready to assist you. 🚀";
    } else if (model === "my-local-model") {
      provider = "mock";
      mockReply = "🤖 My Local Model: Connected successfully! I am running on localhost:11434 via Ollama. 💻";
    } else if (["dall-e-3", "flux-schnell", "midjourney-v6", "stable-diffusion-3.5"].includes(model)) {
      provider = "mock-gen";
      providerModelId = model;
    } else if (["sora", "kling-1.5", "runway-gen3", "luma-dream-machine"].includes(model)) {
      provider = "mock-gen";
      providerModelId = model;
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

    // 0. Vision Gating validation
    if (imageUrl && !isVisionCapable(providerModelId)) {
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: "⚠️ This model can't see images — please switch to a vision-capable model (look for the camera icon)."
            }
          }
        ]
      });
    }

    // Handle Generation Models immediately
    if (provider === "mock-gen") {
      if (["dall-e-3", "flux-schnell", "midjourney-v6", "stable-diffusion-3.5"].includes(model)) {
        const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(messageText)}?width=1024&height=1024&nologo=true`;
        return NextResponse.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: `🎨 **Generated Image** for prompt: *"${messageText}"*\n\n![Generated Image](${generatedImageUrl})\n\n*(Powered by ${model.toUpperCase()})*`,
              },
            },
          ],
        });
      }

      if (["sora", "kling-1.5", "runway-gen3", "luma-dream-machine"].includes(model)) {
        const stockVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4";
        return NextResponse.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: `🎬 **Generated Video** for prompt: *"${messageText}"*\n\nHere is your generated simulated clip:\n\n[▶ Click here to play video](${stockVideoUrl})\n\n*(Powered by ${model.toUpperCase()})*`,
              },
            },
          ],
        });
      }
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
        messages = formatVisionMessages(dbMessages);

        // Append latest user message if not already included in fetched history (fixes race conditions)
        if (messageText || imageUrl) {
          const lastMsg = dbMessages[dbMessages.length - 1];
          const lastIsThisImage = lastMsg && lastMsg.role === "user" && lastMsg.message_type === "image" && lastMsg.image_url === imageUrl;
          const lastIsThisText = lastMsg && lastMsg.role === "user" && !lastMsg.message_type && lastMsg.content === messageText;

          if (!lastMsg || lastMsg.role !== "user" || (!lastIsThisImage && !lastIsThisText)) {
            if (imageUrl) {
              messages.push({
                role: "user",
                content: [
                  { type: "text", text: messageText || "Describe this image" },
                  { type: "image_url", image_url: { url: imageUrl } }
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
          messages = formatVisionMessages(clientMessages);
        }
      }
    } else if (clientMessages && Array.isArray(clientMessages)) {
      messages = formatVisionMessages(clientMessages);
    }

    if (messages.length === 0 && (messageText || imageUrl)) {
      if (imageUrl) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: messageText || "Describe this image" },
            { type: "image_url", image_url: { url: imageUrl } }
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
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API error response:", errText);
        throw new Error(`Groq API returned status ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          "Content-Type": response.headers.get("content-type") || "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
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
          stream: true,
          ...(reasoningEffort && supportsReasoningEffort(providerModelId) ? { reasoning_effort: reasoningEffort } : {}),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error response:", errText);
        throw new Error(`OpenRouter API returned status ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          "Content-Type": response.headers.get("content-type") || "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
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
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("NVIDIA API error response:", errText);
        throw new Error(`NVIDIA API returned status ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          "Content-Type": response.headers.get("content-type") || "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 6. Handle Direct OpenAI-compatible Providers (OpenAI, Gemini, Perplexity, DeepSeek)
     const directEndpoints = {
       openai: { url: "https://api.openai.com/v1/chat/completions", key: process.env.OPENAI_API_KEY },
       gemini: { url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: process.env.GEMINI_API_KEY },
       perplexity: { url: "https://api.perplexity.ai/chat/completions", key: process.env.PERPLEXITY_API_KEY },
       deepseek: { url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY },
       mistral: { url: "https://api.mistral.ai/v1/chat/completions", key: process.env.MISTRAL_API_KEY },
       cerebras: { url: "https://api.cerebras.ai/v1/chat/completions", key: process.env.CEREBRAS_API_KEY },
     };

    if (directEndpoints[provider]) {
      const endpoint = directEndpoints[provider];
      const apiKey = endpoint.key;
      
      if (!apiKey) {
        return NextResponse.json(
          {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: `⚠️ API Key for direct provider "${provider}" is not configured in your \`.env.local\` file. Please configure the required environment key to connect directly, or remove it to fall back to OpenRouter.`,
                },
              },
            ],
          },
          { status: 200 }
        );
      }

      let response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: messages,
          stream: true,
          ...(reasoningEffort && supportsReasoningEffort(providerModelId) ? { reasoning_effort: reasoningEffort } : {}),
        }),
      });

      // Graceful fallback for Gemini models (e.g. if 2.5-pro has 429 quota exhaustion, fall back to 2.5-flash)
      if (provider === "gemini" && !response.ok && providerModelId !== "gemini-2.5-flash") {
        console.warn(`Direct Gemini API failed with status ${response.status} for model ${providerModelId}. Falling back to gemini-2.5-flash...`);
        response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash",
            messages: messages,
            stream: true,
          }),
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Direct ${provider} API error response:`, errText);
        throw new Error(`Direct ${provider} API returned status ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          "Content-Type": response.headers.get("content-type") || "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 7. Handle Direct Anthropic Provider
    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: `⚠️ ANTHROPIC_API_KEY is not configured in your \`.env.local\` file. Please configure it to connect directly to Claude, or remove it to fall back to OpenRouter.`,
                },
              },
            ],
          },
          { status: 200 }
        );
      }

      // Re-format messages array to Anthropic's expected schema
      let anthropicMessages = [];
      if (sessionId) {
        try {
          const dbMessages = await getMessages(supabase, sessionId);
          anthropicMessages = formatAnthropicMessages(dbMessages);
        } catch (err) {
          console.warn("Fallback to client messages for Anthropic:", err.message);
          anthropicMessages = formatAnthropicMessages(clientMessages || []);
        }
      } else {
        anthropicMessages = formatAnthropicMessages(clientMessages || []);
      }

      // If messages are empty, build from input
      if (anthropicMessages.length === 0 && (messageText || imageUrl)) {
        if (imageUrl) {
          const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            anthropicMessages.push({
              role: "user",
              content: [
                { type: "text", text: messageText || "Describe this image" },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: match[1],
                    data: match[2]
                  }
                }
              ]
            });
          }
        } else {
          anthropicMessages.push({ role: "user", content: messageText });
        }
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: providerModelId,
          messages: anthropicMessages,
          max_tokens: 4096,
          stream: true,
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Direct Anthropic API error response:", errText);
        throw new Error(`Direct Anthropic API returned status ${response.status}`);
      }

      // Response body is consumed as a stream below
      
      // Transform Anthropic SSE stream to OpenAI-compatible SSE format
      const anthropicStream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop();

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                      const openaiChunk = {
                        choices: [{ delta: { content: parsed.delta.text } }],
                      };
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
                      );
                    }
                  } catch (e) {
                    // Skip unparseable lines
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error reading Anthropic stream:", err);
          }

          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(anthropicStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
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
