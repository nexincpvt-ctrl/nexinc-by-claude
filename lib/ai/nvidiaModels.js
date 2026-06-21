/**
 * Curated list of NVIDIA Build's known free models.
 * 
 * Note: This list is hand-picked and may need occasional updates by checking the
 * "Free Endpoint" filter at https://build.nvidia.com/explore/discover.
 * If a model in this list starts returning API errors, it may have moved off the 
 * free tier and should be removed or swapped.
 */
export const NVIDIA_FREE_MODELS = [
  {
    key: "nvidia-nemotron-mini",
    label: "Nemotron Mini 4B (NVIDIA)",
    provider: "nvidia",
    providerModelId: "nvidia/nemotron-mini-4b-instruct",
    tier: "free",
  },
  {
    key: "nvidia-llama-3.3-70b",
    label: "Llama 3.3 70B (NVIDIA)",
    provider: "nvidia",
    providerModelId: "meta/llama-3.3-70b-instruct",
    tier: "free",
  },
  {
    key: "nvidia-llama-3.1-70b",
    label: "Llama 3.1 70B (NVIDIA)",
    provider: "nvidia",
    providerModelId: "meta/llama-3.1-70b-instruct",
    tier: "free",
  },
  {
    key: "nvidia-llama-3.1-8b",
    label: "Llama 3.1 8B (NVIDIA)",
    provider: "nvidia",
    providerModelId: "meta/llama-3.1-8b-instruct",
    tier: "free",
  },
  {
    key: "nvidia-nemotron-ultra",
    label: "Nemotron 3 Ultra (NVIDIA)",
    provider: "nvidia",
    providerModelId: "nvidia/nemotron-3-ultra-550b-a55b",
    tier: "free",
  },
];
