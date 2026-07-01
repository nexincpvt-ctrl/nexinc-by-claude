export const MODELS_REGISTRY = [
  // ================= ULTRA LEVEL =================
  {
    name: "Gemini 3.1 Pro",
    level: "ultra",
    providers: [
      { name: "Google AI Studio", key: "gemini-3.1-pro-google", provider: "gemini", providerModelId: "gemini-2.5-pro" }
    ]
  },
  {
    name: "Gemini Deep Think",
    level: "ultra",
    providers: [
      { name: "Google AI Studio", key: "gemini-deep-think-google", provider: "gemini", providerModelId: "gemini-2.5-pro" }
    ]
  },
  {
    name: "Xiaomi MiMo 2.5 Pro",
    level: "ultra",
    providers: [
      { name: "Xiaomi API", key: "mimo-v2.5-pro-xiaomi", provider: "mimo", providerModelId: "mimo/mimo-v2.5-pro" },
      { name: "OpenRouter", key: "mimo-v2.5-pro-openrouter", provider: "openrouter", providerModelId: "xiaomi/mimo-v2.5-pro" }
    ]
  },
  {
    name: "DeepSeek V4 Pro",
    level: "ultra",
    providers: [
      { name: "Fireworks", key: "deepseek-v4-pro-fireworks", provider: "fireworks", providerModelId: "accounts/fireworks/models/deepseek-v4-pro" },
      { name: "NVIDIA Build", key: "deepseek-v4-pro-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.3-70b-instruct" },
      { name: "SambaNova", key: "deepseek-v4-pro-sambanova", provider: "openrouter", providerModelId: "deepseek/deepseek-v4-pro" },
      { name: "OpenRouter", key: "deepseek-v4-pro-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-v4-pro" }
    ]
  },
  {
    name: "DeepSeek R1",
    level: "ultra",
    providers: [
      { name: "Fireworks", key: "deepseek-r1-fireworks", provider: "openrouter", providerModelId: "deepseek/deepseek-r1" },
      { name: "NVIDIA Build", key: "deepseek-r1-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.3-70b-instruct" },
      { name: "SambaNova", key: "deepseek-r1-sambanova", provider: "openrouter", providerModelId: "deepseek/deepseek-r1" },
      { name: "Cerebras", key: "deepseek-r1-cerebras", provider: "cerebras", providerModelId: "gpt-oss-120b" },
      { name: "Groq", key: "deepseek-r1-groq", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "OpenRouter", key: "deepseek-r1-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-r1" }
    ]
  },
  {
    name: "Qwen3 235B Thinking",
    level: "ultra",
    providers: [
      { name: "Fireworks", key: "qwen3-235b-fireworks", provider: "openrouter", providerModelId: "qwen/qwen3-235b" },
      { name: "OpenRouter", key: "qwen3-235b-openrouter", provider: "openrouter", providerModelId: "qwen/qwen3-235b" }
    ]
  },
  {
    name: "Kimi K2",
    level: "ultra",
    providers: [
      { name: "Fireworks", key: "kimi-k2-fireworks", provider: "openrouter", providerModelId: "kimi/k2" },
      { name: "OpenRouter", key: "kimi-k2-openrouter", provider: "openrouter", providerModelId: "kimi/k2" }
    ]
  },
  {
    name: "GPT-OSS-120B",
    level: "ultra",
    providers: [
      { name: "Fireworks", key: "gpt-oss-120b-fireworks", provider: "cerebras", providerModelId: "gpt-oss-120b" },
      { name: "Cerebras", key: "gpt-oss-120b-cerebras", provider: "cerebras", providerModelId: "gpt-oss-120b" },
      { name: "Groq", key: "gpt-oss-120b-groq", provider: "groq", providerModelId: "openai/gpt-oss-120b" },
      { name: "OpenRouter", key: "gpt-oss-120b-openrouter", provider: "openrouter", providerModelId: "openai/gpt-oss-120b" }
    ]
  },
  {
    name: "GLM-4.7",
    level: "ultra",
    providers: [
      { name: "Z.AI", key: "glm-4.7-zai", provider: "zai", providerModelId: "glm-4-plus" },
      { name: "Cerebras", key: "glm-4.7-cerebras", provider: "cerebras", providerModelId: "zai-glm-4.7" }
    ]
  },

  // ================= HIGH LEVEL =================
  {
    name: "Gemini 3 Flash",
    level: "high",
    providers: [
      { name: "Google AI Studio", key: "gemini-3-flash-google", provider: "gemini", providerModelId: "gemini-2.5-flash" }
    ]
  },
  {
    name: "Gemini 3.1 Flash",
    level: "high",
    providers: [
      { name: "Google AI Studio", key: "gemini-3.1-flash-google", provider: "gemini", providerModelId: "gemini-2.5-flash" }
    ]
  },
  {
    name: "Gemini 3.1 Flash Lite",
    level: "high",
    providers: [
      { name: "Google AI Studio", key: "gemini-3.1-flash-lite-google", provider: "gemini", providerModelId: "gemini-2.5-flash" }
    ]
  },
  {
    name: "Gemma 4 31B IT",
    level: "high",
    providers: [
      { name: "Google AI Studio", key: "gemma-4-31b-it-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Fireworks", key: "gemma-4-31b-it-fireworks", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-4-31b-it-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-4-31b-it-openrouter", provider: "openrouter", providerModelId: "google/gemma-4-31b-it:free" }
    ]
  },
  {
    name: "Fugu",
    level: "high",
    providers: [
      { name: "Fugu API", key: "fugu-sakana", provider: "sakana", providerModelId: "sakana/fugu" },
      { name: "OpenRouter", key: "fugu-openrouter", provider: "openrouter", providerModelId: "sakana/fugu" }
    ]
  },
  {
    name: "DeepSeek V4 Flash",
    level: "high",
    providers: [
      { name: "Fireworks", key: "deepseek-v4-flash-fireworks", provider: "openrouter", providerModelId: "deepseek/deepseek-v4-flash" },
      { name: "NVIDIA Build", key: "deepseek-v4-flash-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.3-70b-instruct" },
      { name: "OpenRouter", key: "deepseek-v4-flash-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-v4-flash" }
    ]
  },
  {
    name: "DeepSeek V3.2",
    level: "high",
    providers: [
      { name: "Fireworks", key: "deepseek-v3.2-fireworks", provider: "openrouter", providerModelId: "deepseek/deepseek-v3.2" },
      { name: "OpenRouter", key: "deepseek-v3.2-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-v3.2" }
    ]
  },
  {
    name: "DeepSeek V3.1",
    level: "high",
    providers: [
      { name: "Fireworks", key: "deepseek-v3.1-fireworks", provider: "openrouter", providerModelId: "deepseek/deepseek-v3.1" },
      { name: "OpenRouter", key: "deepseek-v3.1-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-v3.1" }
    ]
  },
  {
    name: "GPT-OSS-20B",
    level: "high",
    providers: [
      { name: "Fireworks", key: "gpt-oss-20b-fireworks", provider: "groq", providerModelId: "openai/gpt-oss-20b" },
      { name: "Cerebras", key: "gpt-oss-20b-cerebras", provider: "groq", providerModelId: "openai/gpt-oss-20b" },
      { name: "Groq", key: "gpt-oss-20b-groq", provider: "groq", providerModelId: "openai/gpt-oss-20b" },
      { name: "OpenRouter", key: "gpt-oss-20b-openrouter", provider: "openrouter", providerModelId: "openai/gpt-oss-20b" }
    ]
  },
  {
    name: "Llama 4 Maverick",
    level: "high",
    providers: [
      { name: "Fireworks", key: "llama-4-maverick-fireworks", provider: "groq", providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct" },
      { name: "NVIDIA Build", key: "llama-4-maverick-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.3-70b-instruct" },
      { name: "SambaNova", key: "llama-4-maverick-sambanova", provider: "groq", providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct" },
      { name: "Groq", key: "llama-4-maverick-groq", provider: "groq", providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct" },
      { name: "OpenRouter", key: "llama-4-maverick-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct:free" }
    ]
  },
  {
    name: "Llama 3.3 70B Instruct",
    level: "high",
    providers: [
      { name: "Fireworks", key: "llama-3.3-70b-instruct-fireworks", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "NVIDIA Build", key: "llama-3.3-70b-instruct-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.3-70b-instruct" },
      { name: "SambaNova", key: "llama-3.3-70b-instruct-sambanova", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "Cerebras", key: "llama-3.3-70b-instruct-cerebras", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "Groq", key: "llama-3.3-70b-instruct-groq", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "OpenRouter", key: "llama-3.3-70b-instruct-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-3.3-70b-instruct:free" }
    ]
  },
  {
    name: "Mistral Large",
    level: "high",
    providers: [
      { name: "Mistral AI", key: "mistral-large-mistral", provider: "mistral", providerModelId: "mistral-large-latest" },
      { name: "Fireworks", key: "mistral-large-fireworks", provider: "mistral", providerModelId: "mistral-large-latest" },
      { name: "OpenRouter", key: "mistral-large-openrouter", provider: "openrouter", providerModelId: "mistral/mistral-large" }
    ]
  },
  {
    name: "Mistral Medium 3",
    level: "high",
    providers: [
      { name: "Mistral AI", key: "mistral-medium-3-mistral", provider: "mistral", providerModelId: "mistral-medium-latest" }
    ]
  },
  {
    name: "MiniMax M2.7",
    level: "high",
    providers: [
      { name: "Fireworks", key: "minimax-m2.7-fireworks", provider: "openrouter", providerModelId: "minimax/minimax-m2.7" },
      { name: "OpenRouter", key: "minimax-m2.7-openrouter", provider: "openrouter", providerModelId: "minimax/minimax-m2.7" }
    ]
  },
  {
    name: "GLM-4.6",
    level: "high",
    providers: [
      { name: "Z.AI", key: "glm-4.6-zai", provider: "zai", providerModelId: "glm-4-0520" },
      { name: "Cerebras", key: "glm-4.6-cerebras", provider: "cerebras", providerModelId: "zai-glm-4.7" }
    ]
  },
  {
    name: "GLM-4.6V",
    level: "high",
    providers: [
      { name: "Z.AI", key: "glm-4.6v-zai", provider: "zai", providerModelId: "glm-4v" }
    ]
  },
  {
    name: "GLM-4.5",
    level: "high",
    providers: [
      { name: "Z.AI", key: "glm-4.5-zai", provider: "zai", providerModelId: "glm-4" },
      { name: "Cerebras", key: "glm-4.5-cerebras", provider: "cerebras", providerModelId: "zai-glm-4.7" }
    ]
  },
  {
    name: "GLM-4.5 Air",
    level: "high",
    providers: [
      { name: "Z.AI", key: "glm-4.5-air-zai", provider: "zai", providerModelId: "glm-4-air" }
    ]
  },

  // ================= MEDIUM LEVEL =================
  {
    name: "Gemma 4 27B",
    level: "medium",
    providers: [
      { name: "Google AI Studio", key: "gemma-4-27b-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Fireworks", key: "gemma-4-27b-fireworks", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-4-27b-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-4-27b-openrouter", provider: "openrouter", providerModelId: "google/gemma-4-31b-it:free" }
    ]
  },
  {
    name: "Gemma 4 E4B",
    level: "medium",
    providers: [
      { name: "Google AI Studio", key: "gemma-4-e4b-google", provider: "cerebras", providerModelId: "gemma-4-31b" }
    ]
  },
  {
    name: "Gemma 3 27B",
    level: "medium",
    providers: [
      { name: "Google AI Studio", key: "gemma-3-27b-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-3-27b-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-3-27b-openrouter", provider: "openrouter", providerModelId: "google/gemma-4-31b-it:free" }
    ]
  },
  {
    name: "Gemma 3 12B",
    level: "medium",
    providers: [
      { name: "Google AI Studio", key: "gemma-3-12b-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-3-12b-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-3-12b-openrouter", provider: "openrouter", providerModelId: "google/gemma-4-31b-it:free" }
    ]
  },
  {
    name: "Gemma 3n",
    level: "medium",
    providers: [
      { name: "Google AI Studio", key: "gemma-3n-google", provider: "cerebras", providerModelId: "gemma-4-31b" }
    ]
  },
  {
    name: "DeepSeek Coder V2",
    level: "medium",
    providers: [
      { name: "Fireworks", key: "deepseek-coder-v2-fireworks", provider: "openrouter", providerModelId: "deepseek/deepseek-coder" },
      { name: "OpenRouter", key: "deepseek-coder-v2-openrouter", provider: "openrouter", providerModelId: "deepseek/deepseek-coder" }
    ]
  },
  {
    name: "Qwen2.5 Coder",
    level: "medium",
    providers: [
      { name: "Fireworks", key: "qwen-2.5-coder-fireworks", provider: "groq", providerModelId: "qwen/qwen3-32b" },
      { name: "Groq", key: "qwen-2.5-coder-groq", provider: "groq", providerModelId: "qwen/qwen3-32b" },
      { name: "OpenRouter", key: "qwen-2.5-coder-openrouter", provider: "openrouter", providerModelId: "qwen/qwen-2.5-coder-32b" }
    ]
  },
  {
    name: "Llama 3.1 70B",
    level: "medium",
    providers: [
      { name: "Fireworks", key: "llama-3.1-70b-fireworks", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "NVIDIA Build", key: "llama-3.1-70b-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.1-70b-instruct" },
      { name: "SambaNova", key: "llama-3.1-70b-sambanova", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "Cerebras", key: "llama-3.1-70b-cerebras", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "Groq", key: "llama-3.1-70b-groq", provider: "groq", providerModelId: "llama-3.3-70b-versatile" },
      { name: "OpenRouter", key: "llama-3.1-70b-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-3.3-70b-instruct:free" }
    ]
  },
  {
    name: "Llama 3.1 8B",
    level: "medium",
    providers: [
      { name: "Fireworks", key: "llama-3.1-8b-fireworks", provider: "groq", providerModelId: "llama-3.1-8b-instant" },
      { name: "NVIDIA Build", key: "llama-3.1-8b-nvidia", provider: "nvidia", providerModelId: "meta/llama-3.1-8b-instruct" },
      { name: "Groq", key: "llama-3.1-8b-groq", provider: "groq", providerModelId: "llama-3.1-8b-instant" },
      { name: "OpenRouter", key: "llama-3.1-8b-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-3.1-8b-instruct:free" }
    ]
  },
  {
    name: "Mistral Small",
    level: "medium",
    providers: [
      { name: "Mistral AI", key: "mistral-small-mistral", provider: "mistral", providerModelId: "mistral-small-latest" },
      { name: "Fireworks", key: "mistral-small-fireworks", provider: "mistral", providerModelId: "mistral-small-latest" },
      { name: "Groq", key: "mistral-small-groq", provider: "groq", providerModelId: "llama-3.1-8b-instant" },
      { name: "OpenRouter", key: "mistral-small-openrouter", provider: "openrouter", providerModelId: "mistral/mistral-small" }
    ]
  },
  {
    name: "Ministral",
    level: "medium",
    providers: [
      { name: "Mistral AI", key: "ministral-mistral", provider: "mistral", providerModelId: "ministral-8b-latest" }
    ]
  },
  {
    name: "GLM-4 Air",
    level: "medium",
    providers: [
      { name: "Z.AI", key: "glm-4-air-zai", provider: "zai", providerModelId: "glm-4-air" }
    ]
  },

  // ================= LOW LEVEL =================
  {
    name: "Gemma 4 E2B",
    level: "low",
    providers: [
      { name: "Google AI Studio", key: "gemma-4-e2b-google", provider: "cerebras", providerModelId: "gemma-4-31b" }
    ]
  },
  {
    name: "Gemma 2",
    level: "low",
    providers: [
      { name: "Google AI Studio", key: "gemma-2-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-2-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-2-openrouter", provider: "openrouter", providerModelId: "google/gemma-2-9b-it:free" }
    ]
  },
  {
    name: "Gemma 7B",
    level: "low",
    providers: [
      { name: "Google AI Studio", key: "gemma-7b-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "Groq", key: "gemma-7b-groq", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-7b-openrouter", provider: "openrouter", providerModelId: "google/gemma-2-9b-it:free" }
    ]
  },
  {
    name: "Gemma 2B",
    level: "low",
    providers: [
      { name: "Google AI Studio", key: "gemma-2b-google", provider: "cerebras", providerModelId: "gemma-4-31b" },
      { name: "OpenRouter", key: "gemma-2b-openrouter", provider: "openrouter", providerModelId: "google/gemma-2-9b-it:free" }
    ]
  },
  {
    name: "Llama 3.2 3B",
    level: "low",
    providers: [
      { name: "Fireworks", key: "llama-3.2-3b-fireworks", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-3b-instruct:free" },
      { name: "Groq", key: "llama-3.2-3b-groq", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-3b-instruct:free" },
      { name: "OpenRouter", key: "llama-3.2-3b-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-3b-instruct:free" }
    ]
  },
  {
    name: "Llama 3.2 1B",
    level: "low",
    providers: [
      { name: "Fireworks", key: "llama-3.2-1b-fireworks", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-1b-instruct:free" },
      { name: "Groq", key: "llama-3.2-1b-groq", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-1b-instruct:free" },
      { name: "OpenRouter", key: "llama-3.2-1b-openrouter", provider: "openrouter", providerModelId: "meta-llama/llama-3.2-1b-instruct:free" }
    ]
  }
];
