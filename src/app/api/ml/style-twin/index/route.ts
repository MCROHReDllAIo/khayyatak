import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { indexProductsFromMetadata } from "@/lib/ml/style-twin";
import { countProductEmbeddings } from "@/lib/ml/product-embeddings-db";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { max?: number };
    const result = await indexProductsFromMetadata({ max: body.max });
    const indexedCount = await countProductEmbeddings();

    return NextResponse.json({
      ...result,
      indexedCount,
    });
  } catch (err) {
    console.error("[ml/style-twin/index]", err);
    return NextResponse.json({ error: "Index failed" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getApiUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const indexedCount = await countProductEmbeddings();
  return NextResponse.json({ indexedCount });
}
