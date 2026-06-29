/**
 * NexInc AI Model Tagging System.
 * 
 * This helper assigns section-aware tags to dynamically discovered and curated models.
 * Sections are categorized as:
 * - 'chat': general conversational capability (assigned to all models).
 * - 'code': specialized programming, debugging, and code generation.
 * - 'research': reasoning, deep thinking, or structured information gathering.
 * - 'learning': explanations, study planning, study roadmaps (assigned to non-coder models).
 * - 'image': image generation models (not matching text endpoints).
 * 
 * NOTE: This is a simple heuristic based on keywords. If a model is mapped
 * incorrectly or needs adjustments, human developers can modify the keyword lists below.
 */
export function getModelTags(modelId) {
  const id = modelId.toLowerCase();
  const tags = ["chat"]; // Every model is usable in the general Chat tab.

  if (id.includes("coder") || id.includes("code") || id.includes("devstral") || id.includes("o3-mini")) {
    tags.push("code");
  }
  if (
    id.includes("r1") ||
    id.includes("reason") ||
    id.includes("qwq") ||
    id.includes("think") ||
    id.includes("nemotron") ||
    id === "o1" ||
    id.startsWith("o1-") ||
    id === "o3-mini" ||
    id.startsWith("o3-mini-")
  ) {
    tags.push("research");
  }
  
  // Models not specifically tagged for code/research are still good general-purpose
  // models, so also make them available in Learning by default (explaining things
  // is a general-purpose task most models handle fine):
  if (!tags.includes("code")) {
    tags.push("learning");
  }

  // Vision-capable models for Image Reading (multimodal chat)
  if (
    id.includes("vision") ||
    id.includes("pixtral") ||
    id.includes("gemini") ||
    id.includes("gpt-4o") ||
    id.includes("claude-3") ||
    id === "o1" ||
    id.startsWith("o1-") ||
    id.includes("-vl") ||
    id.includes("vl-")
  ) {
    tags.push("image");
  }

  // Premium models
  if (
    id.includes("gemini-2.5-pro") ||
    id.includes("gpt-4o") ||
    id.includes("gpt-5") ||
    id.includes("gpt-5.5") ||
    id.includes("gpt-5.4") ||
    id.includes("claude-3.5") ||
    id.includes("perplexity") ||
    id.includes("deepseek") ||
    id.includes("mistral-large") ||
    id.includes("mistral-medium") ||
    id.includes("mistral-small-4") ||
    id.includes("custom-cloud-gpu") ||
    id.includes("my-local-model") ||
    id.includes("google/gemini-2.5-pro") ||
    id === "o1" ||
    id.startsWith("o1-") ||
    id === "o3-mini" ||
    id.startsWith("o3-mini-") ||
    id.includes("gpt-oss-120b") ||
    id.includes("zai-glm-4.7")
  ) {
    tags.push("premium");
  }
  
  return tags;
}

/**
 * Keyword heuristic to check if a model has Vision capabilities.
 * This is a keyword heuristic and may need occasional manual adjustment if a new
 * vision model doesn't match these patterns — the human can add more keywords here later.
 */
export function isVisionCapable(modelId) {
  const id = modelId.toLowerCase();
  return (
    id.includes("vision") ||
    id.includes("-vl") ||
    id.includes("vl-") ||
    id.includes("scout") ||
    id.includes("vl2") ||
    id.includes("rerank-vl") ||
    id.includes("gemini") ||
    id.includes("gpt-4o") ||
    id.includes("gpt-5") ||
    id.includes("claude") ||
    id === "o1" ||
    id.startsWith("o1-")
  );
}
