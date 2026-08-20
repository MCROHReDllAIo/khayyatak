import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  getAppearanceProfile,
  saveAppearanceProfile,
  deleteAppearanceProfile,
  validateAppearanceImage,
} from "@/lib/db/appearance";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getAppearanceProfile(auth.id);
  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      source: profile.source,
      mime_type: profile.mime_type,
      has_image: true,
      updated_at: profile.updated_at,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { imageData, mimeType, source } = body as {
    imageData?: string;
    mimeType?: string;
    source?: "upload" | "avatar";
  };

  if (!imageData || !mimeType) {
    return NextResponse.json({ error: "imageData and mimeType required" }, { status: 400 });
  }

  const validation = validateAppearanceImage(imageData, mimeType);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const profile = await saveAppearanceProfile(auth.id, imageData, mimeType, source ?? "upload");
  if (!profile) {
    return NextResponse.json({ error: "Could not save appearance profile" }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      source: profile.source,
      mime_type: profile.mime_type,
      has_image: true,
      updated_at: profile.updated_at,
    },
  });
}

export async function DELETE() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await deleteAppearanceProfile(auth.id);
  return NextResponse.json({ success: true });
}

/** Authenticated fetch of user's own image — never public */
export async function PUT(_request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getAppearanceProfile(auth.id);
  if (!profile) {
    return NextResponse.json({ error: "No appearance profile" }, { status: 404 });
  }

  return NextResponse.json({
    imageData: profile.image_data,
    mimeType: profile.mime_type,
  });
}
