import { NextResponse } from "next/server";
import { getAuthProvider, isAuthConfigured } from "@/lib/auth/config";

export async function GET() {
  const provider = getAuthProvider();
  return NextResponse.json({
    configured: isAuthConfigured(),
    provider,
  });
}
