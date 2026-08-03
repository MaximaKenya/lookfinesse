"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Wifi, WifiOff, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useVendorContext } from "@/hooks/useVendorContext";

const QUEUE_KEY = "lf_pos_queue_v1";

type QueuedSale = {
  client_sale_id: string;
  vendor_id: string;
  sku: string;
  qty: number;
  unit_price: number;
  payment_method: string;
  created_offline_at: string;
};

function loadQueue(): QueuedSale[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedSale[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export default function VendorPosPage() {
  const { vendorId } = useVendorContext();
  const [online, setOnline] = useState(true);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [method, setMethod] = useState("cash");
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [sales, setSales] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    setOnline(navigator.onLine);
    setQueue(loadQueue());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "POS_SYNC") syncQueue();
      });
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSales = useCallback(async () => {
    if (!vendorId || !navigator.onLine) return;
    const res = await fetch(`/api/vendor/pos/sale?vendor_id=${vendorId}`);
    const data = await res.json();
    setSales(data.sales ?? []);
  }, [vendorId]);

  useEffect(() => {
    refreshSales();
  }, [refreshSales]);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const q = loadQueue();
    if (!q.length) {
      setQueue([]);
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/vendor/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: q }),
      });
      const data = await res.json();
      const okIds = new Set(
        (data.results ?? []).filter((r: { ok: boolean; client_sale_id?: string }) => r.ok).map((r: { client_sale_id?: string }) => r.client_sale_id)
      );
      const remaining = q.filter((s) => !okIds.has(s.client_sale_id));
      saveQueue(remaining);
      setQueue(remaining);
      if (remaining.length === 0) toast.success("POS queue synced");
      await refreshSales();
    } catch {
      toast.error("Sync failed — will retry when online");
    } finally {
      setSyncing(false);
    }
  }, [refreshSales]);

  useEffect(() => {
    if (online) syncQueue();
  }, [online, syncQueue]);

  const ringUp = async () => {
    if (!vendorId) {
      toast.error("Vendor required");
      return;
    }
    if (!sku.trim()) {
      toast.error("Enter SKU");
      return;
    }

    // Resolve price from scan if zero
    let unit = price;
    if (!unit) {
      try {
        const res = await fetch(`/api/vendor/inventory/scan?sku=${encodeURIComponent(sku)}&vendor_id=${vendorId}`);
        const data = await res.json();
        const p = data.products?.[0];
        if (p?.price) unit = Number(p.price);
      } catch {
        /* offline */
      }
    }

    const sale: QueuedSale = {
      client_sale_id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vendor_id: vendorId,
      sku: sku.trim(),
      qty,
      unit_price: unit,
      payment_method: method,
      created_offline_at: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      const next = [...loadQueue(), sale];
      saveQueue(next);
      setQueue(next);
      toast.message("Saved offline — will sync later");
      setSku("");
      return;
    }

    const res = await fetch("/api/vendor/pos/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Sale recorded");
      setSku("");
      refreshSales();
    } else {
      const next = [...loadQueue(), sale];
      saveQueue(next);
      setQueue(next);
      toast.error("Queued locally after API error");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Vendor POS
          </h1>
          <p className="text-sm text-white/45 mt-1">In-store sales with offline queue sync.</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            online ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
          }`}
        >
          {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-lg"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
            placeholder="Qty"
          />
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
            placeholder="Price"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
          >
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
          </select>
        </div>
        <button
          type="button"
          onClick={ringUp}
          className="w-full rounded-xl bg-white text-black font-bold py-3"
        >
          Ring up · KES {(qty * price).toLocaleString()}
        </button>
      </div>

      {queue.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-amber-200">{queue.length} queued sale(s)</p>
            <button
              type="button"
              onClick={syncQueue}
              disabled={!online || syncing}
              className="text-xs font-semibold text-white/80 hover:text-white disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sync now"}
            </button>
          </div>
          <ul className="text-xs text-white/50 space-y-1">
            {queue.map((s) => (
              <li key={s.client_sale_id}>
                {s.sku} ×{s.qty} · {s.payment_method}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="text-sm uppercase tracking-wider text-white/40 mb-2">Recent synced</h2>
      <ul className="space-y-2">
        {sales.slice(0, 15).map((s) => (
          <li key={String(s.id)} className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-white/70 flex justify-between">
            <span>
              {String(s.sku ?? "—")} ×{Number(s.qty ?? 1)}
            </span>
            <span>KES {Number(s.total_kes ?? 0).toLocaleString()}</span>
          </li>
        ))}
        {sales.length === 0 && <li className="text-white/30 text-sm">No sales yet.</li>}
      </ul>
    </div>
  );
}
