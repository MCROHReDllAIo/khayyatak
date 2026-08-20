import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getProductById } from "@/lib/db/products";
import { getMeasurementProfile } from "@/lib/db/measurements-pg";
import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isPostgresConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const {
    productId,
    sizeLabel,
    deliveryAddress,
    notes,
  } = body as {
    productId?: string;
    sizeLabel?: string;
    deliveryAddress?: string;
    notes?: string;
  };

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || !product.available) {
    return NextResponse.json({ error: "Product not available" }, { status: 404 });
  }

  const measurements = await getMeasurementProfile(auth.id);

  const { rows: designRows } = await pgQuery<{ id: string }>(
    `INSERT INTO designs (user_id, name, config)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id`,
    [
      auth.id,
      product.name_ar,
      JSON.stringify({
        garmentType: product.category === "abaya" ? "abaya" : "dishdasha",
        color: product.color ?? "—",
        colorKey: product.color_key ?? "custom",
        fabric: product.fabric ?? "—",
        fabricKey: product.fabric?.toLowerCase() ?? "custom",
        collar: product.style ?? "—",
        collarKey: product.style_cut ?? "custom",
        embroidery: "—",
        embroideryKey: "none",
        name: product.name_ar,
        productId: product.id,
      }),
    ]
  );

  const designId = designRows[0]?.id;

  const { rows: orderRows } = await pgQuery<Record<string, unknown>>(
    `INSERT INTO orders (
      customer_id, tailor_id, design_id, measurement_id,
      status, total_price, delivery_days, delivery_address, customer_name, specification
    ) VALUES ($1, $2, $3, $4, 'received', $5, $6, $7, $8, $9::jsonb)
    RETURNING *`,
    [
      auth.id,
      product.tailor_id,
      designId,
      measurements?.id ?? null,
      product.price,
      5,
      deliveryAddress ?? null,
      auth.full_name_ar ?? auth.full_name,
      JSON.stringify({ size_label: sizeLabel, notes, product_id: productId }),
    ]
  );

  const order = orderRows[0];
  if (!order) {
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  await pgQuery(
    `INSERT INTO order_items (order_id, product_id, description, quantity, unit_price)
     VALUES ($1, $2, $3, 1, $4)`,
    [order.id, productId, product.name_ar, product.price]
  );

  await pgQuery(
    `INSERT INTO order_status_history (order_id, status, note) VALUES ($1, 'received', $2)`,
    [order.id, "Order created from AI chat product"]
  );

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total_price: Number(order.total_price),
      product: { id: product.id, name_ar: product.name_ar },
      tailor_id: product.tailor_id,
    },
  });
}
