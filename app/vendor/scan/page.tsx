"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Package, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { useVendorContext } from "@/hooks/useVendorContext";

type ProductHit = {
  id: string;
  name?: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  stock?: number;
};

export default function VendorScanPage() {
  const { vendorId } = useVendorContext();
  const [sku, setSku] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState<"receive" | "count" | "pick">("receive");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lookup = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ sku: code.trim() });
        if (vendorId) params.set("vendor_id", vendorId);
        const res = await fetch(`/api/vendor/inventory/scan?${params}`);
        const data = await res.json();
        setHits(data.products ?? []);
        if (!(data.products ?? []).length) toast.message("No product for that SKU");
      } finally {
        setLoading(false);
      }
    },
    [vendorId]
  );

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not available — enter SKU manually");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // BarcodeDetector when available (Chrome Android)
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (BD && videoRef.current) {
        const detector = new BD({ formats: ["ean_13", "ean_8", "code_128", "qr_code", "upc_a"] });
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              setSku(codes[0].rawValue);
              await lookup(codes[0].rawValue);
              stopCamera();
              return;
            }
          } catch {
            /* keep scanning */
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    } catch {
      toast.error("Camera permission denied");
    }
  };

  useEffect(() => () => stopCamera(), []);

  const adjust = async (productId: string) => {
    const res = await fetch("/api/vendor/inventory/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, delta, mode, vendor_id: vendorId }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Stock → ${data.stock}`);
      setHits((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: data.stock, stock_quantity: data.stock } : p))
      );
    } else toast.error(data.error ?? "Update failed");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2 text-cyan-300">
        <ScanBarcode className="h-5 w-5" />
        <h1 className="text-2xl font-bold text-white">SKU / barcode scan</h1>
      </div>
      <p className="text-sm text-white/45 mb-6">
        Receive stock, recount, or POS pick by camera barcode or manual SKU.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(sku)}
          placeholder="Enter or scan SKU"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none"
        />
        <button
          type="button"
          onClick={() => lookup(sku)}
          className="rounded-xl bg-white text-black px-4 font-semibold text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={scanning ? stopCamera : startCamera}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <Camera className="h-4 w-4" />
          {scanning ? "Stop camera" : "Open camera"}
        </button>
        {(["receive", "count", "pick"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${
              mode === m ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/5 text-white/50 border border-white/10"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {scanning && (
        <video ref={videoRef} className="w-full rounded-2xl border border-white/10 mb-4 aspect-video object-cover bg-black" muted playsInline />
      )}

      <label className="block text-xs text-white/40 mb-1">Qty / count value</label>
      <input
        type="number"
        min={0}
        value={delta}
        onChange={(e) => setDelta(Number(e.target.value))}
        className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white mb-6"
      />

      <div className="space-y-3">
        {hits.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-white truncate flex items-center gap-2">
                <Package className="h-4 w-4 text-white/40 shrink-0" />
                {p.name}
              </p>
              <p className="text-xs text-white/40 mt-1">
                SKU {p.sku} · stock {p.stock_quantity ?? p.stock ?? "—"} · KES {Number(p.price ?? 0).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => adjust(p.id)}
              className="shrink-0 rounded-xl bg-white text-black px-3 py-2 text-xs font-bold"
            >
              Apply {mode}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
