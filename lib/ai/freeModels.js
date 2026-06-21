/**
 * Free Models discovery and caching module for NexInc.
 * Feeds free models dynamically from Groq and OpenRouter APIs.
 */

// Module-level in-memory cache
let modelCache = {
  models: null,
  timestamp: 0,
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache duration

/**
 * Format raw model IDs into a readable title label
 */
function formatGroqLabel(id) {
  // Strip any organisation prefix if present
  const basename = id.includes("/") ? id.split("/").pop() : id;

  // Replace dashes/underscores and capitalize words
  let formatted = basename
    .replace(/[-_]/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());

  // Clean abbreviations
  formatted = formatted
    .replace(/Llama/i, "Llama")
    .replace(/Gemma/i, "Gemma")
    .replace(/Mixtral/i, "Mixtral")
    .replace(/Mistral/i, "Mistral")
    .replace(/\bGp\b/gi, "GP")
    .replace(/\bOss\b/gi, "OSS")
    .replace(/\b\d+b\b/gi, (match) => match.toUpperCase()) // e.g. "8b" -> "8B"
    .trim();

  return `${formatted} (Groq)`;
}

/**
 * Retrieve free models from Groq API
 */
export async function getGroqFreeModels() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GROQ_API_KEY is missing. Groq discovery skipped.");
    return [];
  }

  const response = await fetch("https://api.groq.com/openai/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    // Prevent Next.js from aggressively caching the fetch requests directly
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Groq API returned status ${response.status}`);
  }

  const result = await response.json();
  const modelsList = result.data || [];

  // Filter out non-chat models (audio, safeguards, etc.)
  const chatModels = modelsList.filter((model) => {
    const id = model.id.toLowerCase();
    return (
      !id.includes("whisper") &&
      !id.includes("tts") &&
      !id.includes("guard") &&
      !id.includes("safeguard")
    );
  });

  return chatModels.map((model) => ({
    key: `groq-${model.id}`,
    label: formatGroqLabel(model.id),
    provider: "groq",
    providerModelId: model.id,
    tier: "free",
  }));
}

/**
 * Retrieve free models from OpenRouter API
 */
export async function getOpenRouterFreeModels() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: OPENROUTER_API_KEY is missing. OpenRouter discovery skipped.");
    return [];
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API returned status ${response.status}`);
  }

  const result = await response.json();
  const modelsList = result.data || [];

  // Keep only models that are free (both prompt and completion costs are 0)
  const freeModels = modelsList.filter((model) => {
    const promptCost = Number(model.pricing?.prompt || 0);
    const completionCost = Number(model.pricing?.completion || 0);
    return promptCost === 0 && completionCost === 0;
  });

  // Map to unified model schema
  const mapped = freeModels.map((model) => {
    // Strip ":free" or similar suffixes from display labels
    const displayName = model.name.replace(/:\s*free/gi, "").trim();
    return {
      key: `openrouter-${model.id}`,
      label: `${displayName} (OpenRouter)`,
      provider: "openrouter",
      providerModelId: model.id,
      tier: "free",
    };
  });

  // Cap list to top 20 models for UI readability
  return mapped.slice(0, 20);
}

/**
 * Combined free models list with 1 hour in-memory caching
 */
export async function getCachedFreeModels() {
  const now = Date.now();
  if (modelCache.models && now - modelCache.timestamp < CACHE_DURATION) {
    return modelCache.models;
  }

  // Run fetches concurrently
  const [groqList, openRouterList] = await Promise.all([
    getGroqFreeModels().catch((err) => {
      console.warn("WARNING: Failed to fetch Groq free models:", err.message);
      return [];
    }),
    getOpenRouterFreeModels().catch((err) => {
      console.warn("WARNING: Failed to fetch OpenRouter free models:", err.message);
      return [];
    }),
  ]);

  const combined = [...groqList, ...openRouterList];

  // Only update cache if we retrieved some models successfully
  if (combined.length > 0) {
    modelCache.models = combined;
    modelCache.timestamp = now;
  }

  return combined;
}
