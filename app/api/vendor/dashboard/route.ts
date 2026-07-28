import { NextResponse } from "next/server";



import { createSupabaseServer } from "@/lib/supabaseServer";

import { resolveVendorScope } from "@/lib/vendor/scope";

import {

  fetchVendorOrders,

  orderAmount,

  sumOrderRevenue,

} from "@/lib/vendor/orders";



export const runtime = "nodejs";



export async function GET() {

  try {

    const supabase = await createSupabaseServer();

    const scopeResult = await resolveVendorScope(supabase);



    if (!scopeResult.ok) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const { vendorId, storeId } = scopeResult.scope;



    let productsQuery = supabase.from("products").select("*");

    if (storeId) {

      productsQuery = productsQuery.or(

        `vendor_id.eq.${vendorId},store_id.eq.${storeId}`

      );

    } else {

      productsQuery = productsQuery.eq("vendor_id", vendorId);

    }



    const [

      { data: products, error: productsError },

      orders,

      { data: ledger, error: ledgerError },

      { data: wallets, error: walletError },

      { data: fraudEvents, error: fraudError },

    ] = await Promise.all([

      productsQuery,

      fetchVendorOrders(supabase, { vendorId, storeId }),

      supabase

        .from("ledger_entries")

        .select("*")

        .eq("vendor_id", vendorId),

      supabase.from("vendor_wallets").select("*").eq("vendor_id", vendorId),

      supabase

        .from("fraud_events")

        .select("*")

        .eq("vendor_id", vendorId)

        .order("created_at", { ascending: false }),

    ]);



    if (productsError) throw productsError;

    if (ledgerError) throw ledgerError;

    if (walletError) throw walletError;

    if (fraudError) throw fraudError;



    const totalRevenue =

      ledger

        ?.filter((entry) => entry.type === "credit")

        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0) ?? 0;



    const currentMonth = new Date().getMonth();



    const monthlyRevenue =

      ledger

        ?.filter((entry) => {

          const date = new Date(entry.created_at);

          return (

            entry.type === "credit" && date.getMonth() === currentMonth

          );

        })

        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0) ?? 0;



    const activeProducts =

      products?.filter(

        (product) =>

          product.status === "active" || product.is_active === true

      ).length ?? 0;



    const totalOrders = orders.length;



    const pendingOrders =

      orders.filter((order) => order.status === "pending").length;



    const lowStockProducts =

      products?.filter(

        (product) =>

          Number(product.inventory_count ?? product.stock_quantity ?? 0) < 5

      ).length ?? 0;



    const walletBalance =

      wallets?.reduce(

        (sum, wallet) => sum + Number(wallet.balance || 0),

        0

      ) ?? 0;



    const completedCount = orders.filter(

      (order) => order.status === "completed" || order.status === "paid"

    ).length;



    const conversionRate =

      totalOrders > 0

        ? Number(((completedCount / totalOrders) * 100).toFixed(1))

        : 0;



    const revenueTimeline =

      ledger

        ?.filter((entry) => entry.type === "credit")

        .slice(-20)

        .map((entry) => ({

          time: new Date(entry.created_at).toLocaleTimeString("en-KE", {

            hour: "2-digit",

            minute: "2-digit",

          }),

          revenue: Number(entry.amount || 0),

          rawTimestamp: entry.created_at,

          anomaly: Number(entry.amount || 0) > 100000,

          label:

            Number(entry.amount || 0) > 100000

              ? "High Value Transaction"

              : "Normal Flow",

        })) ?? [];



    const topProducts =

      products

        ?.map((product) => {

          const relatedOrders =

            orders.filter((order) => order.product_id === product.id) ?? [];



          const revenue = relatedOrders.reduce(

            (sum, order) => sum + orderAmount(order),

            0

          );



          return {

            id: product.id,

            name: product.name,

            revenue,

            orders_count: relatedOrders.length,

          };

        })

        .sort((a, b) => b.revenue - a.revenue)

        .slice(0, 5) ?? [];



    const operationalAlerts: {

      type: string;

      severity: string;

      message: string;

    }[] = [];



    if (lowStockProducts > 0) {

      operationalAlerts.push({

        type: "inventory",

        severity: "warning",

        message: `${lowStockProducts} products are running low on inventory.`,

      });

    }



    if (fraudEvents && fraudEvents.length > 0) {

      operationalAlerts.push({

        type: "fraud",

        severity: "critical",

        message: `${fraudEvents.length} fraud events detected requiring review.`,

      });

    }



    if (pendingOrders > 10) {

      operationalAlerts.push({

        type: "fulfillment",

        severity: "warning",

        message: `${pendingOrders} orders are pending fulfillment.`,

      });

    }



    const orderRevenue = sumOrderRevenue(orders, ["paid", "completed"]);



    return NextResponse.json({

      vendorId,

      empty: totalOrders === 0 && (products?.length ?? 0) === 0,

      metrics: {

        totalRevenue: totalRevenue || orderRevenue,

        monthlyRevenue,

        activeProducts,

        totalOrders,

        pendingOrders,

        lowStockProducts,

        walletBalance,

        conversionRate,

      },

      revenue: {

        timeline: revenueTimeline,

        grossVolume: totalRevenue || orderRevenue,

        netRevenue: monthlyRevenue,

        fraudLoss:

          fraudEvents?.reduce(

            (sum, item) => sum + Number(item.amount || 0),

            0

          ) ?? 0,

      },

      recentOrders: orders.slice(0, 10),

      topProducts,

      operationalAlerts,

    });

  } catch (err) {

    console.error("Vendor dashboard API failed:", err);



    return NextResponse.json(

      { error: "Failed to load vendor dashboard" },

      { status: 500 }

    );

  }

}

