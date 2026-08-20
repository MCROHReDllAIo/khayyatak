import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  getMeasurementProfile,
  upsertMeasurementProfile,
  deleteMeasurementProfile,
} from "@/lib/db/measurements-pg";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getMeasurementProfile(auth.id);
  return NextResponse.json({ measurements: profile });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const profile = await upsertMeasurementProfile(auth.id, body);
  if (!profile) {
    return NextResponse.json({ error: "Could not save measurements" }, { status: 500 });
  }

  return NextResponse.json({ measurements: profile });
}

export async function DELETE() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await deleteMeasurementProfile(auth.id);
  return NextResponse.json({ success: true });
}
