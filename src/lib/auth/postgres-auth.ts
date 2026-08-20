import { pgQuery } from "@/lib/db/postgres";
import { hashPassword, verifyPassword } from "@/lib/auth/session";
import type { UserRole } from "@/types";

export interface AuthProfile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: UserRole;
  city_id?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

function mapProfile(row: Record<string, unknown>): AuthProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: (row.full_name as string) ?? (row.email as string),
    full_name_ar: (row.full_name_ar as string) ?? undefined,
    role: row.role as UserRole,
    city_id: (row.city_id as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    avatar_url: (row.avatar_url as string) ?? undefined,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function friendlySignupError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();
  if (
    lower.includes("auth_accounts") ||
    lower.includes("email already") ||
    (lower.includes("duplicate") && lower.includes("email"))
  ) {
    return "هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من إنشاء حساب.";
  }
  if (lower.includes("profiles_pkey") || lower.includes("duplicate key")) {
    return "الحساب موجود مسبقًا. سجّل الدخول أو استخدم بريدًا آخر.";
  }
  if (lower.includes("password")) {
    return "كلمة المرور قصيرة جدًا (6 أحرف على الأقل).";
  }
  return "تعذر إنشاء الحساب. حاول مرة أخرى.";
}

export async function getProfileById(userId: string): Promise<AuthProfile | null> {
  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT id, email, full_name, full_name_ar, role, city_id, phone, avatar_url, created_at
     FROM profiles WHERE id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

export async function signUpWithPostgres(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<{ profile?: AuthProfile; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 6) {
    return { error: "كلمة المرور قصيرة جدًا (6 أحرف على الأقل)." };
  }

  const existingAccount = await pgQuery(
    `SELECT 1 FROM auth_accounts WHERE lower(email) = $1`,
    [normalizedEmail]
  );
  if (existingAccount.rowCount) {
    return { error: "هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من إنشاء حساب." };
  }

  const existingProfile = await pgQuery(
    `SELECT 1 FROM profiles WHERE lower(email) = $1`,
    [normalizedEmail]
  );
  if (existingProfile.rowCount) {
    return { error: "هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من إنشاء حساب." };
  }

  const existingAuthUser = await pgQuery(
    `SELECT 1 FROM auth.users WHERE lower(email) = $1`,
    [normalizedEmail]
  );
  if (existingAuthUser.rowCount) {
    return { error: "هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من إنشاء حساب." };
  }

  const passwordHash = hashPassword(password);

  const client = (await import("@/lib/db/postgres")).getPgPool();
  const db = await client.connect();

  try {
    await db.query("BEGIN");

    const userRes = await db.query<{ id: string }>(
      `INSERT INTO auth.users (email, raw_user_meta_data)
       VALUES ($1, $2::jsonb)
       RETURNING id`,
      [normalizedEmail, JSON.stringify({ full_name: fullName, role })]
    );
    const userId = userRes.rows[0]?.id;
    if (!userId) throw new Error("Failed to create user");

    // Trigger `on_auth_user_created` already inserts a profiles row.
    // Upsert so we never hit profiles_pkey, and we set name/role correctly.
    await db.query(
      `INSERT INTO profiles (id, email, full_name, full_name_ar, role)
       VALUES ($1, $2, $3, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name,
         full_name_ar = EXCLUDED.full_name_ar,
         role = EXCLUDED.role`,
      [userId, normalizedEmail, fullName, role]
    );

    await db.query(
      `INSERT INTO auth_accounts (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [userId, normalizedEmail, passwordHash]
    );

    if (role === "tailor") {
      const existingTailor = await db.query(
        `SELECT 1 FROM tailors WHERE profile_id = $1 LIMIT 1`,
        [userId]
      );
      if (!existingTailor.rowCount) {
        const cityRes = await db.query<{ id: string }>(`SELECT id FROM cities ORDER BY name_ar LIMIT 1`);
        const cityId = cityRes.rows[0]?.id ?? null;
        await db.query(
          `INSERT INTO tailors (profile_id, name_ar, name_en, city_id, verified, specializations)
           VALUES ($1, $2, $2, $3, false, ARRAY['dishdasha'])`,
          [userId, fullName, cityId]
        );
      }
    }

    await db.query("COMMIT");
    const profile = await getProfileById(userId);
    return { profile: profile ?? undefined };
  } catch (err) {
    await db.query("ROLLBACK");
    return { error: friendlySignupError(err) };
  } finally {
    db.release();
  }
}

export async function signInWithPostgres(
  email: string,
  password: string
): Promise<{ profile?: AuthProfile; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pgQuery<{ user_id: string; password_hash: string }>(
    `SELECT user_id, password_hash FROM auth_accounts WHERE lower(email) = $1 LIMIT 1`,
    [normalizedEmail]
  );
  const account = rows[0];
  if (!account || !verifyPassword(password, account.password_hash)) {
    return { error: "البريد أو كلمة المرور غير صحيحة." };
  }
  const profile = await getProfileById(account.user_id);
  if (!profile) return { error: "لم يتم العثور على الملف الشخصي." };
  return { profile };
}
