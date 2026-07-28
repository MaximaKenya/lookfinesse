// app/api/agents/run/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { runAgents } from "@/lib/agents/orchestrator";

function computeSignalWeights(entry: any) {
  return {
    failed_attempts: Number(entry.failed_attempts || 0) * 0.25,

    geo_velocity: entry.geo_velocity_flag
      ? 0.35
      : 0,

    new_device: entry.is_new_device
      ? 0.2
      : 0,

    high_value:
      Number(entry.amount || 0) > 500000
        ? 0.2
        : 0,
  };
}

/**
 * 🇰🇪 SAFE KENYAN TIME FORMATTER
 */
function formatKenyanTime(dateValue: any) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  // prevents Invalid Date
  if (isNaN(date.getTime())) {
    return "Invalid";
  }

  return date.toLocaleTimeString("en-KE", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 📈 REVENUE / RISK TIMELINE
 */
function buildTimeline(entries: any[]) {
  const now = new Date();

  return entries
    .filter((e) => e.created_at)
    .map((e, index) => {
      const rawDate = new Date(e.created_at);

      // 🚨 Skip invalid dates
      if (isNaN(rawDate.getTime())) {
        return null;
      }

      // 🇰🇪 Convert to Kenyan time
      const kenyaDate = new Date(
        rawDate.toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        })
      );

      // 🚨 Prevent future timestamps
      if (kenyaDate.getTime() > now.getTime()) {
        return null;
      }

      return {
        id: index,

        // REAL timestamp for sorting
        timestamp: kenyaDate.getTime(),

        // DISPLAY LABEL
        time: kenyaDate.toLocaleTimeString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),

        revenue: Number(e.amount || 0),

        anomaly:
          Number(e.failed_attempts || 0) > 3 ||
          e.geo_velocity_flag ||
          e.is_new_device,

        label: e.geo_velocity_flag
          ? "Geo-risk spike"
          : Number(e.failed_attempts || 0) > 3
          ? "Failed attempt spike"
          : e.is_new_device
          ? "New device detected"
          : undefined,
      };
    })
    .filter(Boolean)

    // ✅ TRUE chronological ordering
    .sort(
      (a: any, b: any) =>
        a.timestamp - b.timestamp
    );
}
/**
 * 🧠 WHY NOW ENGINE
 */
function generateWhyNow(vendorEvents: any[]) {
  const recent = vendorEvents.slice(-5);

  const geo = recent.filter(
    (e) => e.geo_velocity_flag
  ).length;

  const device = recent.filter(
    (e) => e.is_new_device
  ).length;

  const failed = recent.reduce(
    (a, e) =>
      a + Number(e.failed_attempts || 0),
    0
  );

  const reasons: string[] = [];

  if (geo > 0) {
    reasons.push(
      "location switching detected"
    );
  }

  if (device > 0) {
    reasons.push("new device usage spike");
  }

  if (failed > 5) {
    reasons.push(
      "repeated failed attempts"
    );
  }

  if (!reasons.length) {
    return "No recent anomaly spike detected.";
  }

  return `Vendor became risky in the last 6–24 hours due to ${reasons.join(
    " + "
  )}.`;
}

/**
 * 🧩 CLUSTER ENGINE
 */
function clusterVendors(vendorsWithRisk: any[]) {
  const clusters: Record<string, any[]> = {
    GEO_ANOMALY: [],
    DEVICE_SWITCH: [],
    HIGH_VALUE_SPIKE: [],
    LOW_RISK: [],
  };

  for (const v of vendorsWithRisk) {
    const flags = v.flags || [];

    if (flags.includes("geo_velocity")) {
      clusters.GEO_ANOMALY.push(v);
    } else if (
      flags.includes("new_device")
    ) {
      clusters.DEVICE_SWITCH.push(v);
    } else if (v.riskScore > 70) {
      clusters.HIGH_VALUE_SPIKE.push(v);
    } else {
      clusters.LOW_RISK.push(v);
    }
  }

  return clusters;
}

export async function GET() {
  /**
   * 🔥 IMPORTANT:
   * created_at MUST exist in your DB
   */

  const { data: transactions } =
    await supabase
      .from("ledger_entries")
      .select("*")
      .order("created_at", {
        ascending: true,
      })
      .limit(200);

  const { data: vendors } =
    await supabase
      .from("vendors")
      .select("*")
      .limit(100);

  const tx = transactions || [];

  const result = await runAgents(
    tx,
    vendors || []
  );

  // =========================
  // 📈 REVENUE INTELLIGENCE
  // =========================

  const grossVolume = tx.reduce(
    (a, t) =>
      a + Number(t.amount || 0),
    0
  );

  const fraudLoss = tx
    .filter(
      (t) =>
        Number(t.failed_attempts || 0) > 3 ||
        t.geo_velocity_flag
    )
    .reduce(
      (a, t) =>
        a +
        Number(t.amount || 0) * 0.08,
      0
    );

  const netRevenue =
    grossVolume - fraudLoss;

  const timeline = buildTimeline(tx);

  // =========================
  // 💰 TREASURY UTILIZATION
  // =========================

  const totalExposure =
    Number(
      result?.treasury?.totalExposure || 1
    ) || 1;

  const usdUtilization = Math.min(
    Math.round(
      (grossVolume / totalExposure) * 35
    ),
    100
  );

  const kesUtilization = Math.min(
    Math.round(
      (grossVolume / totalExposure) * 25
    ),
    100
  );

  const eurUtilization = Math.min(
    Math.round(
      (grossVolume / totalExposure) * 40
    ),
    100
  );

  // =========================
  // 🧠 ENRICH VENDOR RISK
  // =========================

  const enrichedVendorRisk = (
    result.vendorRisk?.risky || []
  ).map((vendor: any) => {
    const vendorTx = tx.filter((t) => {
      return (
        String(t.vendor_id) ===
          String(vendor.vendorId) ||
        String(t.vendor_id) ===
          String(
            vendor.vendorId?.toString()
          )
      );
    });

    return {
      ...vendor,

      timeline: buildTimeline(vendorTx),

      signalWeights:
        vendorTx.map(
          computeSignalWeights
        ),

      whyNow:
        generateWhyNow(vendorTx),

      evidence: {
        transactions:
          vendorTx.slice(-10),

        totalTransactions:
          vendorTx.length,
      },
    };
  });

  const clusters = clusterVendors(
    enrichedVendorRisk
  );

  return NextResponse.json({
    success: true,

    result: {
      ...result,

      revenue: {
        grossVolume,
        netRevenue,
        fraudLoss,
        timeline,
      },

      treasury: {
        ...result.treasury,

        utilization: Math.min(
          Math.round(
            (grossVolume /
              (totalExposure || 1)) *
              100
          ),
          100
        ),

        usdUtilization,
        kesUtilization,
        eurUtilization,
      },

      compliance: {
        ...result.compliance,

        totalViolations:
          result?.compliance?.violations
            ?.length || 0,
      },

      vendorRisk: {
        risky: enrichedVendorRisk,
        clusters,
      },
    },
  });
}