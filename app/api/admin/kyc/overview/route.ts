import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

const SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [{ data: kycRows }, { data: vendorKyc }] = await Promise.all([
      db
        .from("kyc_verifications")
        .select("id, user_id, status, document_url, tier, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("vendor_kyc")
        .select(
          "id, vendor_id, full_name, country, document_type, document_number, verification_status, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const userKyc = (kycRows ?? []).map((k) => ({
      id: k.id,
      subject_id: k.user_id,
      subject_type: "user" as const,
      status: String(k.status ?? "pending"),
      document_url: k.document_url,
      tier: k.tier ?? null,
      label: `User ${(k.user_id as string | null)?.slice(0, 8) ?? "—"}`,
      created_at: k.created_at,
      source: "kyc_verifications" as const,
    }));

    const vendors = (vendorKyc ?? []).map((k) => ({
      id: k.id,
      subject_id: k.vendor_id,
      subject_type: "vendor" as const,
      status: String(k.verification_status ?? "PENDING"),
      document_url: null as string | null,
      tier: null as string | null,
      label: k.full_name ?? `Vendor ${(k.vendor_id as string).slice(0, 8)}`,
      country: k.country,
      document_type: k.document_type,
      created_at: k.created_at,
      source: "vendor_kyc" as const,
    }));

    const items = [...userKyc, ...vendors].sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );

    const isPending = (s: string) =>
      ["pending", "PENDING", "submitted", "SUBMITTED", "review"].includes(s);
    const isApproved = (s: string) =>
      ["approved", "APPROVED", "verified", "VERIFIED"].includes(s);
    const isRejected = (s: string) =>
      ["rejected", "REJECTED", "denied", "DENIED"].includes(s);

    const pending = items.filter((i) => isPending(i.status));
    const approved = items.filter((i) => isApproved(i.status));
    const rejected = items.filter((i) => isRejected(i.status));

    const statusBreakdown = [
      { status: "pending", count: pending.length },
      { status: "approved", count: approved.length },
      { status: "rejected", count: rejected.length },
      {
        status: "other",
        count: items.length - pending.length - approved.length - rejected.length,
      },
    ].filter((s) => s.count > 0);

    return NextResponse.json({
      empty: items.length === 0,
      kpis: {
        total: items.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        vendorCount: vendors.length,
        userCount: userKyc.length,
      },
      items,
      pending,
      statusBreakdown,
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/kyc] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load KYC overview",
        empty: true,
        kpis: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          vendorCount: 0,
          userCount: 0,
        },
        items: [],
        pending: [],
        statusBreakdown: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
