import { MISTRAL_FREE_MODELS } from "./mistralModels";

export const CURATED_FREE_MODELS = [
  // Strongest Reasoning
  {
    key: "gpt-oss-120b-reasoning",
    label: "OpenAI GPT-OSS-120B",
    provider: "openai",
    providerModelId: "gpt-4o-mini",
    tier: "free",
    category: "Strongest Reasoning",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "llama-3.3-70b-reasoning",
    label: "Llama 3.3 70B",
    provider: "groq",
    providerModelId: "llama-3.3-70b-versatile",
    tier: "free",
    category: "Strongest Reasoning",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "qwen3-next-80b-reasoning",
    label: "Qwen3 Next 80B A3B Instruct",
    provider: "groq",
    providerModelId: "qwen-2.5-coder-32b",
    tier: "free",
    category: "Strongest Reasoning",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "nemotron-3-ultra-reasoning",
    label: "Nemotron 3 Ultra",
    provider: "nvidia",
    providerModelId: "nvidia/nemotron-3-ultra-550b-a55b",
    tier: "free",
    category: "Strongest Reasoning",
    tags: ["chat", "code", "research", "learning"]
  },

  // Best Coding
  {
    key: "cohere-north-mini-code",
    label: "Cohere North Mini Code",
    provider: "mistral",
    providerModelId: "codestral-latest",
    tier: "free",
    category: "Best Coding",
    tags: ["chat", "code", "learning"]
  },
  {
    key: "gpt-oss-120b-coding",
    label: "GPT-OSS-120B",
    provider: "openai",
    providerModelId: "gpt-4o-mini",
    tier: "free",
    category: "Best Coding",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "qwen3-next-80b-coding",
    label: "Qwen3 Next 80B A3B Instruct",
    provider: "groq",
    providerModelId: "qwen-2.5-coder-32b",
    tier: "free",
    category: "Best Coding",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "llama-3.3-70b-coding",
    label: "Llama 3.3 70B",
    provider: "groq",
    providerModelId: "llama-3.3-70b-versatile",
    tier: "free",
    category: "Best Coding",
    tags: ["chat", "code", "research", "learning"]
  },

  // Fastest
  {
    key: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    provider: "groq",
    providerModelId: "llama-3.1-8b-instant",
    tier: "free",
    category: "Fastest",
    tags: ["chat", "code", "learning"]
  },
  {
    key: "nemotron-mini-4b",
    label: "Nemotron Mini 4B",
    provider: "nvidia",
    providerModelId: "nvidia/nemotron-mini-4b-instruct",
    tier: "free",
    category: "Fastest",
    tags: ["chat", "learning"]
  },
  {
    key: "gpt-oss-20b",
    label: "GPT OSS 20B",
    provider: "openai",
    providerModelId: "gpt-4o-mini",
    tier: "free",
    category: "Fastest",
    tags: ["chat", "code", "learning"]
  },
  {
    key: "gemma-4-26b",
    label: "Gemma 4 26B",
    provider: "groq",
    providerModelId: "gemma2-9b-it",
    tier: "free",
    category: "Fastest",
    tags: ["chat", "code", "learning"]
  },

  // Free Models Worth Trying
  // OpenRouter Free Models
  {
    key: "openrouter-openrouter/free",
    label: "OpenRouter Free (Auto Selection)",
    provider: "openrouter",
    providerModelId: "openrouter/free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-meta-llama/llama-3.2-3b-instruct:free",
    label: "Llama 3.2 3B Instruct (Free)",
    provider: "openrouter",
    providerModelId: "meta-llama/llama-3.2-3b-instruct:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nousresearch/hermes-3-llama-3.1-405b:free",
    label: "Hermes 3 405B Instruct (Free)",
    provider: "openrouter",
    providerModelId: "nousresearch/hermes-3-llama-3.1-405b:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "research"]
  },
  {
    key: "openrouter-qwen/qwen3-coder-480b-a35b-instruct:free",
    label: "Qwen 3 Coder 480B (Free)",
    provider: "openrouter",
    providerModelId: "qwen/qwen3-coder-480b-a35b-instruct:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "code"]
  },
  {
    key: "openrouter-nvidia/nemotron-3-nano-30b-a3b:free",
    label: "Nemotron 3 Nano 30B A3B (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-3-nano-30b-a3b:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/nemotron-3-nano-omni:free",
    label: "Nemotron 3 Nano Omni (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-3-nano-omni:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/nemotron-nano-9b-v2:free",
    label: "Nemotron Nano 9B V2 (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-nano-9b-v2:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/nemotron-nano-12b-v2-vl:free",
    label: "Nemotron Nano 12B VL (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-nano-12b-v2-vl:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "image"]
  },
  {
    key: "openrouter-google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 26B IT (Free)",
    provider: "openrouter",
    providerModelId: "google/gemma-4-26b-a4b-it:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/llama-nemotron-embed-vl-1b-v2:free",
    label: "Nemotron Embed VL 1B V2 (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "image"]
  },
  {
    key: "openrouter-nvidia/llama-nemotron-rerank-vl-1b-v2:free",
    label: "Nemotron Rerank VL 1B V2 (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "image"]
  },
  {
    key: "openrouter-liquid/lfm-2.5-1.2b-thinking:free",
    label: "LFM 2.5 1.2B Thinking (Free)",
    provider: "openrouter",
    providerModelId: "liquid/lfm-2.5-1.2b-thinking:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "research"]
  },
  {
    key: "openrouter-liquid/lfm-2.5-1.2b-instruct:free",
    label: "LFM 2.5 1.2B Instruct (Free)",
    provider: "openrouter",
    providerModelId: "liquid/lfm-2.5-1.2b-instruct:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/nemotron-3.5-content-safety:free",
    label: "Nemotron 3.5 Content Safety (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-3.5-content-safety:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-qwen/qwen3-next-80b-a3b-instruct:free",
    label: "Qwen 3 Next 80B Instruct (Free)",
    provider: "openrouter",
    providerModelId: "qwen/qwen3-next-80b-a3b-instruct:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B Instruct (Free)",
    provider: "openrouter",
    providerModelId: "meta-llama/llama-3.3-70b-instruct:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "openrouter-cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    label: "Venice Uncensored (Free)",
    provider: "openrouter",
    providerModelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-nvidia/nemotron-3-ultra:free",
    label: "Nemotron 3 Ultra (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-3-ultra:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "research"]
  },
  {
    key: "openrouter-poolside/laguna-m.1:free",
    label: "Laguna M.1 (Free)",
    provider: "openrouter",
    providerModelId: "poolside/laguna-m.1:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "code"]
  },
  {
    key: "openrouter-nvidia/nemotron-3-super:free",
    label: "Nemotron 3 Super (Free)",
    provider: "openrouter",
    providerModelId: "nvidia/nemotron-3-super:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-openai/gpt-oss-120b:free",
    label: "OpenAI GPT-OSS-120B (Free)",
    provider: "openrouter",
    providerModelId: "openai/gpt-oss-120b:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "research"]
  },
  {
    key: "openrouter-poolside/laguna-xs.2:free",
    label: "Laguna XS.2 (Free)",
    provider: "openrouter",
    providerModelId: "poolside/laguna-xs.2:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "code"]
  },
  {
    key: "openrouter-cohere/north-mini-code:free",
    label: "Cohere North Mini Code (Free)",
    provider: "openrouter",
    providerModelId: "cohere/north-mini-code:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "code"]
  },
  {
    key: "openrouter-google/gemma-4-31b-it:free",
    label: "Gemma 4 31B IT (Free)",
    provider: "openrouter",
    providerModelId: "google/gemma-4-31b-it:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "openrouter-openai/gpt-oss-20b:free",
    label: "OpenAI GPT-OSS-20B (Free)",
    provider: "openrouter",
    providerModelId: "openai/gpt-oss-20b:free",
    tier: "free",
    category: "OpenRouter Free Models",
    tags: ["chat", "learning"]
  },
  {
    key: "qwen3-next-80b-trying",
    label: "Qwen3 Next 80B A3B Instruct",
    provider: "groq",
    providerModelId: "qwen-2.5-coder-32b",
    tier: "free",
    category: "Free Models Worth Trying",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "gemma-4-31b",
    label: "Gemma 4 31B",
    provider: "groq",
    providerModelId: "gemma2-9b-it",
    tier: "free",
    category: "Free Models Worth Trying",
    tags: ["chat", "code", "learning"]
  },
  {
    key: "nemotron-3-ultra-trying",
    label: "Nemotron 3 Ultra",
    provider: "nvidia",
    providerModelId: "nvidia/nemotron-3-ultra-550b-a55b",
    tier: "free",
    category: "Free Models Worth Trying",
    tags: ["chat", "code", "research", "learning"]
  },
  {
    key: "llama-3.3-70b-trying",
    label: "Llama 3.3 70B",
    provider: "groq",
    providerModelId: "llama-3.3-70b-versatile",
    tier: "free",
    category: "Free Models Worth Trying",
    tags: ["chat", "code", "research", "learning"]
  },
];

export async function getCachedFreeModels() {
  const mistralWithCategory = MISTRAL_FREE_MODELS.map(m => ({
    ...m,
    category: "Mistral Free Models"
  }));
  return [...CURATED_FREE_MODELS, ...mistralWithCategory];
}
