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

  if (id.includes("coder") || id.includes("code") || id.includes("devstral")) {
    tags.push("code");
  }
  if (id.includes("r1") || id.includes("reason") || id.includes("qwq") || id.includes("think") || id.includes("nemotron")) {
    tags.push("research");
  }
  
  // Models not specifically tagged for code/research are still good general-purpose
  // models, so also make them available in Learning by default (explaining things
  // is a general-purpose task most models handle fine):
  if (!tags.includes("code")) {
    tags.push("learning");
  }
  
  return tags;
}
