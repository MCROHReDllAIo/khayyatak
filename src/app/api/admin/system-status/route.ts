import { NextResponse } from "next/server";
import { getSystemStatusPayload } from "@/lib/admin/system-status";

export async function GET() {
  try {
    const status = await getSystemStatusPayload();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load system status" },
      { status: 500 }
    );
  }
}
