import { NextResponse } from "next/server";
import { getCachedFreeModels } from "@/lib/ai/freeModels";
import { getModelTags } from "@/lib/ai/modelTags";

export async function GET() {
  try {
    const combinedFree = await getCachedFreeModels();
    
    const mappedFree = combinedFree.map((model) => ({
      ...model,
      tags: model.tags || getModelTags(model.providerModelId),
      vision: false,
    }));
    
    return NextResponse.json({
      freeModels: mappedFree,
    });
  } catch (err) {
    console.error("Error generating models list:", err);
    return NextResponse.json({
      freeModels: [],
      error: err.message,
    });
  }
}
