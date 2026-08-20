import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";

export interface AppearanceProfile {
  id: string;
  user_id: string;
  image_data: string;
  mime_type: string;
  source: "upload" | "avatar";
  created_at: string;
  updated_at: string;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateAppearanceImage(
  imageData: string,
  mimeType: string
): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: "نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP." };
  }

  const base64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    return { valid: false, error: "حجم الصورة يتجاوز 5 ميغابايت." };
  }

  return { valid: true };
}

export async function getAppearanceProfile(userId: string): Promise<AppearanceProfile | null> {
  if (!isPostgresConfigured()) return null;

  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM user_appearance_profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    image_data: row.image_data as string,
    mime_type: row.mime_type as string,
    source: row.source as "upload" | "avatar",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function saveAppearanceProfile(
  userId: string,
  imageData: string,
  mimeType: string,
  source: "upload" | "avatar" = "upload"
): Promise<AppearanceProfile | null> {
  if (!isPostgresConfigured()) return null;

  const validation = validateAppearanceImage(imageData, mimeType);
  if (!validation.valid) return null;

  const existing = await getAppearanceProfile(userId);

  if (existing) {
    const { rows } = await pgQuery<Record<string, unknown>>(
      `UPDATE user_appearance_profiles
       SET image_data = $2, mime_type = $3, source = $4, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, imageData, mimeType, source]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      image_data: row.image_data as string,
      mime_type: row.mime_type as string,
      source: row.source as "upload" | "avatar",
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO user_appearance_profiles (user_id, image_data, mime_type, source)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, imageData, mimeType, source]
  );

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    image_data: row.image_data as string,
    mime_type: row.mime_type as string,
    source: row.source as "upload" | "avatar",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function deleteAppearanceProfile(userId: string): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  await pgQuery(`DELETE FROM user_appearance_profiles WHERE user_id = $1`, [userId]);
  return true;
}
