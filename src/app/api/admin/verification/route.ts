import { NextResponse } from "next/server";
import { getTailorVerificationList } from "@/lib/db/analytics";

export async function GET() {
  try {
    const list = await getTailorVerificationList();
    return NextResponse.json({ list });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
