import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import type {
  InnovationSession,
  CustomDesignVersion,
  InnovationDesignSpec,
  CustomDesignRequest,
  FeasibilityReview,
  InnovationRequestStatus,
  FeasibilityDecision,
} from "@/lib/innovation/types";
import {
  defaultSpecForCategory,
  specToDesignConfig,
  buildExecutionSpecification,
} from "@/lib/innovation/types";
import type { DesignConfig } from "@/types";

export async function createInnovationSession(
  customerId: string,
  title?: string,
  category?: "abaya" | "dishdasha"
): Promise<InnovationSession | null> {
  if (!isPostgresConfigured()) return null;

  const initialSpec = defaultSpecForCategory(category ?? "abaya");
  const defaultTitle =
    category === "dishdasha" ? "تصميم دشداشة" : category === "abaya" ? "تصميم عباية" : "تصميم جديد";

  const { rows: sessionRows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO innovation_sessions (customer_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [customerId, title ?? defaultTitle]
  );

  const session = sessionRows[0];
  if (!session) return null;

  const { rows: designRows } = await pgQuery<{ id: string }>(
    `INSERT INTO custom_designs (session_id, customer_id, title)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [session.id, customerId, title ?? defaultTitle]
  );

  const designId = designRows[0]?.id;
  if (!designId) return null;

  await createDesignVersion(designId, 1, initialSpec, "بداية المشروع", "Project start");

  return mapSession(session);
}

async function createDesignVersion(
  designId: string,
  versionNumber: number,
  spec: InnovationDesignSpec,
  summaryAr: string,
  summaryEn: string,
  referenceImages: string[] = [],
  aiVisualizationUrl?: string
): Promise<CustomDesignVersion | null> {
  const designConfig = specToDesignConfig(spec);

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO custom_design_versions
     (design_id, version_number, spec, design_config, change_summary_ar, change_summary_en, reference_images, ai_visualization_url)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7::jsonb, $8)
     RETURNING *`,
    [
      designId,
      versionNumber,
      JSON.stringify(spec),
      JSON.stringify(designConfig),
      summaryAr,
      summaryEn,
      JSON.stringify(referenceImages),
      aiVisualizationUrl ?? null,
    ]
  );

  return rows[0] ? mapVersion(rows[0]) : null;
}

function mapSession(row: Record<string, unknown>): InnovationSession {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    title: row.title as string,
    status: row.status as string,
    current_version: Number(row.current_version ?? 1),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapVersion(row: Record<string, unknown>): CustomDesignVersion {
  return {
    id: row.id as string,
    design_id: row.design_id as string,
    version_number: Number(row.version_number),
    spec: row.spec as InnovationDesignSpec,
    design_config: row.design_config as DesignConfig,
    change_summary_ar: (row.change_summary_ar as string) ?? undefined,
    change_summary_en: (row.change_summary_en as string) ?? undefined,
    reference_images: (row.reference_images as string[]) ?? [],
    ai_visualization_url: (row.ai_visualization_url as string) ?? undefined,
    created_at: row.created_at as string,
  };
}

export async function getSessionForCustomer(sessionId: string, customerId: string): Promise<{
  session: InnovationSession;
  designId: string;
  versions: CustomDesignVersion[];
  currentVersion: CustomDesignVersion;
} | null> {
  if (!isPostgresConfigured()) return null;

  const { rows: sessions } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM innovation_sessions WHERE id = $1 AND customer_id = $2 LIMIT 1`,
    [sessionId, customerId]
  );

  const sessionRow = sessions[0];
  if (!sessionRow) return null;

  const { rows: designs } = await pgQuery<{ id: string }>(
    `SELECT id FROM custom_designs WHERE session_id = $1 LIMIT 1`,
    [sessionId]
  );

  const designId = designs[0]?.id;
  if (!designId) return null;

  const { rows: versionRows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM custom_design_versions WHERE design_id = $1 ORDER BY version_number ASC`,
    [designId]
  );

  const versions = versionRows.map(mapVersion);
  const currentVersion = versions[versions.length - 1];
  if (!currentVersion) return null;

  return {
    session: mapSession(sessionRow),
    designId,
    versions,
    currentVersion,
  };
}

export async function addDesignVersionFromSpec(
  sessionId: string,
  customerId: string,
  spec: InnovationDesignSpec,
  summaryAr: string,
  summaryEn: string,
  referenceImages?: string[]
): Promise<CustomDesignVersion | null> {
  const data = await getSessionForCustomer(sessionId, customerId);
  if (!data) return null;

  const nextVersion = data.session.current_version + 1;
  const version = await createDesignVersion(
    data.designId,
    nextVersion,
    spec,
    summaryAr,
    summaryEn,
    referenceImages ?? data.currentVersion.reference_images
  );

  if (!version) return null;

  await pgQuery(
    `UPDATE innovation_sessions SET current_version = $2, updated_at = NOW() WHERE id = $1`,
    [sessionId, nextVersion]
  );

  return version;
}

export async function restoreDesignVersion(
  sessionId: string,
  customerId: string,
  versionNumber: number
): Promise<CustomDesignVersion | null> {
  const data = await getSessionForCustomer(sessionId, customerId);
  if (!data) return null;

  const target = data.versions.find((v) => v.version_number === versionNumber);
  if (!target) return null;

  return addDesignVersionFromSpec(
    sessionId,
    customerId,
    target.spec,
    `استعادة النسخة ${versionNumber}`,
    `Restore version ${versionNumber}`,
    target.reference_images
  );
}

export async function submitDesignRequest(
  customerId: string,
  sessionId: string,
  storeId: string,
  measurementId?: string | null,
  aiTailorSummary?: string
): Promise<CustomDesignRequest | null> {
  const data = await getSessionForCustomer(sessionId, customerId);
  if (!data) return null;

  const spec = data.currentVersion.spec;
  const specification = buildExecutionSpecification(
    spec,
    data.currentVersion.version_number,
    data.currentVersion.reference_images
  );

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO custom_design_requests (
      customer_id, store_id, design_id, design_version_id, measurement_id,
      specification, status, ai_tailor_summary, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'SUBMITTED', $7, NOW() + INTERVAL '14 days')
    RETURNING *`,
    [
      customerId,
      storeId,
      data.designId,
      data.currentVersion.id,
      measurementId ?? null,
      JSON.stringify(specification),
      aiTailorSummary ?? null,
    ]
  );

  const request = rows[0];
  if (!request) return null;

  await pgQuery(`UPDATE innovation_sessions SET status = 'submitted', updated_at = NOW() WHERE id = $1`, [
    sessionId,
  ]);

  return mapRequest(request);
}

function mapRequest(row: Record<string, unknown>): CustomDesignRequest {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    store_id: row.store_id as string,
    design_id: row.design_id as string,
    design_version_id: row.design_version_id as string,
    measurement_id: (row.measurement_id as string) ?? undefined,
    specification: (row.specification as Record<string, unknown>) ?? {},
    status: row.status as InnovationRequestStatus,
    complexity_estimate: (row.complexity_estimate as string) ?? undefined,
    ai_tailor_summary: (row.ai_tailor_summary as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function notifyTailor(profileId: string, requestId: string, title: string): Promise<void> {
  if (!isPostgresConfigured()) return;
  await pgQuery(
    `INSERT INTO notifications (user_id, title_ar, title_en, message_ar, message_en)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      profileId,
      "طلب ابتكار جديد",
      "New innovation request",
      `لديك طلب ابتكار جديد — ${title}`,
      `You have a new innovation request — ${title}`,
    ]
  );
}

export async function getTailorProfileId(tailorId: string): Promise<string | null> {
  const { rows } = await pgQuery<{ profile_id: string | null }>(
    `SELECT profile_id FROM tailors WHERE id = $1 LIMIT 1`,
    [tailorId]
  );
  return rows[0]?.profile_id ?? null;
}

export async function getInnovationRequestsForTailor(tailorId: string): Promise<CustomDesignRequest[]> {
  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT r.*, t.name_ar AS store_name_ar, p.full_name AS customer_name
     FROM custom_design_requests r
     JOIN tailors t ON t.id = r.store_id
     JOIN profiles p ON p.id = r.customer_id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC`,
    [tailorId]
  );

  return rows.map((row) => ({
    ...mapRequest(row),
    store_name_ar: row.store_name_ar as string,
    customer_name: row.customer_name as string,
  }));
}

export async function getInnovationRequestsForCustomer(customerId: string): Promise<CustomDesignRequest[]> {
  const { rows } = await pgQuery<Record<string, unknown>>(
    `SELECT r.*, t.name_ar AS store_name_ar,
            rev.id AS review_id, rev.decision, rev.estimated_price, rev.estimated_delivery_days,
            rev.tailor_notes_ar, rev.reviewed_at
     FROM custom_design_requests r
     JOIN tailors t ON t.id = r.store_id
     LEFT JOIN design_feasibility_reviews rev ON rev.request_id = r.id
     WHERE r.customer_id = $1
     ORDER BY r.created_at DESC`,
    [customerId]
  );

  return rows.map((row) => {
    const req = {
      ...mapRequest(row),
      store_name_ar: row.store_name_ar as string,
    };
    if (row.review_id) {
      req.review = {
        id: row.review_id as string,
        request_id: req.id,
        tailor_id: req.store_id,
        decision: row.decision as FeasibilityDecision,
        estimated_price: row.estimated_price != null ? Number(row.estimated_price) : undefined,
        estimated_delivery_days:
          row.estimated_delivery_days != null ? Number(row.estimated_delivery_days) : undefined,
        tailor_notes_ar: (row.tailor_notes_ar as string) ?? undefined,
        reviewed_at: row.reviewed_at as string,
      };
    }
    return req;
  });
}

export async function getInnovationRequestDetail(
  requestId: string,
  userId: string,
  role: "customer" | "tailor"
): Promise<(CustomDesignRequest & { version: CustomDesignVersion; review?: FeasibilityReview }) | null> {
  let query = `
    SELECT r.*, t.name_ar AS store_name_ar, p.full_name AS customer_name
    FROM custom_design_requests r
    JOIN tailors t ON t.id = r.store_id
    JOIN profiles p ON p.id = r.customer_id
    WHERE r.id = $1`;

  const params: unknown[] = [requestId];

  if (role === "customer") {
    query += ` AND r.customer_id = $2`;
    params.push(userId);
  } else {
    query += ` AND t.profile_id = $2`;
    params.push(userId);
  }

  const { rows } = await pgQuery<Record<string, unknown>>(query, params);
  const row = rows[0];
  if (!row) return null;

  const { rows: versionRows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM custom_design_versions WHERE id = $1 LIMIT 1`,
    [row.design_version_id]
  );

  const { rows: reviewRows } = await pgQuery<Record<string, unknown>>(
    `SELECT * FROM design_feasibility_reviews WHERE request_id = $1 LIMIT 1`,
    [requestId]
  );

  const version = versionRows[0] ? mapVersion(versionRows[0]) : undefined;
  if (!version) return null;

  const reviewRow = reviewRows[0];
  const review: FeasibilityReview | undefined = reviewRow
    ? {
        id: reviewRow.id as string,
        request_id: reviewRow.request_id as string,
        tailor_id: reviewRow.tailor_id as string,
        decision: reviewRow.decision as FeasibilityDecision,
        estimated_price: reviewRow.estimated_price != null ? Number(reviewRow.estimated_price) : undefined,
        estimated_delivery_days:
          reviewRow.estimated_delivery_days != null ? Number(reviewRow.estimated_delivery_days) : undefined,
        tailor_notes_ar: (reviewRow.tailor_notes_ar as string) ?? undefined,
        tailor_notes_en: (reviewRow.tailor_notes_en as string) ?? undefined,
        suggested_changes: (reviewRow.suggested_changes as string[]) ?? [],
        reviewed_at: reviewRow.reviewed_at as string,
      }
    : undefined;

  return {
    ...mapRequest(row),
    store_name_ar: row.store_name_ar as string,
    customer_name: row.customer_name as string,
    version,
    review,
  };
}

export async function submitFeasibilityReview(
  requestId: string,
  tailorId: string,
  data: {
    decision: FeasibilityDecision;
    estimated_price?: number;
    estimated_delivery_days?: number;
    tailor_notes_ar: string;
    suggested_changes?: string[];
  }
): Promise<FeasibilityReview | null> {
  const statusMap: Record<FeasibilityDecision, InnovationRequestStatus> = {
    FEASIBLE: "FEASIBLE",
    NEEDS_CHANGES: "NEEDS_CHANGES",
    NOT_FEASIBLE: "NOT_FEASIBLE",
  };

  const { rows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO design_feasibility_reviews
     (request_id, tailor_id, decision, estimated_price, estimated_delivery_days, tailor_notes_ar, suggested_changes)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT (request_id) DO UPDATE SET
       decision = EXCLUDED.decision,
       estimated_price = EXCLUDED.estimated_price,
       estimated_delivery_days = EXCLUDED.estimated_delivery_days,
       tailor_notes_ar = EXCLUDED.tailor_notes_ar,
       suggested_changes = EXCLUDED.suggested_changes,
       reviewed_at = NOW()
     RETURNING *`,
    [
      requestId,
      tailorId,
      data.decision,
      data.estimated_price ?? null,
      data.estimated_delivery_days ?? null,
      data.tailor_notes_ar,
      JSON.stringify(data.suggested_changes ?? []),
    ]
  );

  const review = rows[0];
  if (!review) return null;

  await pgQuery(`UPDATE custom_design_requests SET status = $2, updated_at = NOW() WHERE id = $1`, [
    requestId,
    statusMap[data.decision],
  ]);

  const { rows: reqRows } = await pgQuery<{ customer_id: string }>(
    `SELECT customer_id FROM custom_design_requests WHERE id = $1`,
    [requestId]
  );

  const customerId = reqRows[0]?.customer_id;
  if (customerId) {
    await pgQuery(
      `INSERT INTO notifications (user_id, title_ar, title_en, message_ar, message_en)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        customerId,
        "وصل رد من المتجر",
        "Store response received",
        "وصل رد من الخياط على طلب الابتكار.",
        "The tailor responded to your innovation request.",
      ]
    );
  }

  return {
    id: review.id as string,
    request_id: review.request_id as string,
    tailor_id: review.tailor_id as string,
    decision: review.decision as FeasibilityDecision,
    estimated_price: review.estimated_price != null ? Number(review.estimated_price) : undefined,
    estimated_delivery_days:
      review.estimated_delivery_days != null ? Number(review.estimated_delivery_days) : undefined,
    tailor_notes_ar: (review.tailor_notes_ar as string) ?? undefined,
    suggested_changes: (review.suggested_changes as string[]) ?? [],
    reviewed_at: review.reviewed_at as string,
  };
}

export async function createOrderFromInnovationRequest(
  requestId: string,
  customerId: string
): Promise<{ orderId: string } | null> {
  const detail = await getInnovationRequestDetail(requestId, customerId, "customer");
  if (!detail || detail.status !== "FEASIBLE" || !detail.review) return null;

  const spec = detail.version.spec;
  const designConfig = specToDesignConfig(spec);

  const { rows: designRows } = await pgQuery<{ id: string }>(
    `INSERT INTO designs (user_id, name, config)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id`,
    [customerId, detail.version.change_summary_ar ?? "طلب ابتكار", JSON.stringify(designConfig)]
  );

  const designId = designRows[0]?.id;
  const price = detail.review.estimated_price ?? 0;
  const deliveryDays = detail.review.estimated_delivery_days ?? 7;

  const { rows: orderRows } = await pgQuery<{ id: string }>(
    `INSERT INTO orders (
      customer_id, tailor_id, design_id, measurement_id,
      status, total_price, delivery_days, specification
    ) VALUES ($1, $2, $3, $4, 'received', $5, $6, $7::jsonb)
    RETURNING id`,
    [
      customerId,
      detail.store_id,
      designId,
      detail.measurement_id ?? null,
      price,
      deliveryDays,
      JSON.stringify({ innovation_request_id: requestId, ...detail.specification }),
    ]
  );

  const orderId = orderRows[0]?.id;
  if (!orderId) return null;

  await pgQuery(`UPDATE custom_design_requests SET status = 'ORDER_CREATED', updated_at = NOW() WHERE id = $1`, [
    requestId,
  ]);

  await pgQuery(
    `INSERT INTO order_status_history (order_id, status, note) VALUES ($1, 'received', $2)`,
    [orderId, "Order from innovation request"]
  );

  return { orderId };
}

export async function getTailorIdForProfile(profileId: string): Promise<string | null> {
  const { rows } = await pgQuery<{ id: string }>(
    `SELECT id FROM tailors WHERE profile_id = $1 LIMIT 1`,
    [profileId]
  );
  return rows[0]?.id ?? null;
}
