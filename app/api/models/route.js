import { NextResponse } from "next/server";
import { getCachedFreeModels } from "@/lib/ai/freeModels";
import { NVIDIA_FREE_MODELS } from "@/lib/ai/nvidiaModels";
import { getModelTags } from "@/lib/ai/modelTags";

export async function GET() {
  try {
    const dynamicFreeModels = await getCachedFreeModels();
    
    // Combine fetched Groq/OpenRouter models with our curated NVIDIA models
    // and attach tags to each model dynamically
    const combinedFree = [...dynamicFreeModels, ...NVIDIA_FREE_MODELS].map((model) => ({
      ...model,
      tags: getModelTags(model.providerModelId),
    }));
    
    return NextResponse.json({
      freeModels: combinedFree,
    });
  } catch (err) {
    console.error("Error generating models list:", err);
    
    // Fallback: return static NVIDIA models (with tags attached) so the UI doesn't crash
    const fallbackFree = NVIDIA_FREE_MODELS.map((model) => ({
      ...model,
      tags: getModelTags(model.providerModelId),
    }));
    
    return NextResponse.json({
      freeModels: fallbackFree,
      error: err.message,
    });
  }
}
