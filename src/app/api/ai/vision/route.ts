import { NextResponse } from "next/server";
import { callLLMWithVision, getAIConfig } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { systemPrompt, userPrompt, imageDataUrl } = body as {
      systemPrompt?: string;
      userPrompt?: string;
      imageDataUrl?: string;
    };

    if (!systemPrompt || !userPrompt || !imageDataUrl) {
      return NextResponse.json(
        { error: "systemPrompt, userPrompt, and imageDataUrl are required" },
        { status: 400 }
      );
    }

    const config = getAIConfig();
    const result = await callLLMWithVision(systemPrompt, userPrompt, imageDataUrl);

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model ?? config.visionModel ?? config.model ?? null,
      mock: !result.content,
      error: result.error ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Vision request failed" }, { status: 500 });
  }
}
