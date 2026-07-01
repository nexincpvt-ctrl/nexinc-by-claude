import { NextResponse } from "next/server";
import { MODELS_REGISTRY } from "@/lib/ai/modelsRegistry";
import { isVisionCapable } from "@/lib/ai/modelTags";

export async function GET() {
  try {
    const combinedModels = [];
    MODELS_REGISTRY.forEach(model => {
      model.providers.forEach(p => {
        combinedModels.push({
          key: p.key,
          label: `${model.name} (${p.name})`,
          name: model.name,
          provider: p.provider,
          providerModelId: p.providerModelId,
          tier: model.level === "ultra" ? "ultimate" : "free",
          category: model.level,
          tags: [model.level, p.name],
          vision: isVisionCapable(p.providerModelId)
        });
      });
    });
    
    return NextResponse.json({
      freeModels: combinedModels,
    });
  } catch (err) {
    console.error("Error generating models list:", err);
    return NextResponse.json({
      freeModels: [],
      error: err.message,
    });
  }
}
