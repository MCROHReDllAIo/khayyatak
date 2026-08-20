import { NextResponse } from "next/server";
import { callLLM, getAIConfig, testAIConnection } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { systemPrompt, userPrompt } = body as {
      systemPrompt?: string;
      userPrompt?: string;
    };

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: "systemPrompt and userPrompt are required" },
        { status: 400 }
      );
    }

    const config = getAIConfig();
    const result = await callLLM(systemPrompt, userPrompt);

    const keyIssue =
      config.provider === "openrouter" &&
      result.error?.includes("Management/Provisioning")
        ? "management_key"
        : null;

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      model: result.model ?? config.model ?? null,
      mock: result.provider === "unconfigured" || !result.content,
      error: result.error ?? null,
      keyIssue,
    });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}

export async function GET() {
  const config = getAIConfig();
  if (config.provider === "unconfigured") {
    return NextResponse.json({
      provider: "unconfigured",
      model: null,
      configured: false,
      connected: false,
      error: "AI service is not configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.",
    });
  }

  const test = await testAIConnection();
  return NextResponse.json({
    provider: config.provider,
    model: config.model ?? null,
    configured: true,
    connected: !!test.content,
    error: test.error ?? null,
    keyIssue: (test as { keyIssue?: string }).keyIssue ?? null,
  });
}
