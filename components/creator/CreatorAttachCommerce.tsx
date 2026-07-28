"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Package, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_CATEGORIES } from "@/lib/creator/constants";

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
};

export type CatalogService = {
  id: string;
  title: string;
  price: number;
  category?: string;
  cover_image?: string | null;
};

type Props = {
  vendorId: string | null;
  storeId?: string | null;
  productIds: string[];
  serviceIds: string[];
  onProductsChange: (ids: string[]) => void;
  onServicesChange: (ids: string[]) => void;
  allowProducts?: boolean;
  allowServices?: boolean;
  label?: string;
};

const panelCls =
  "bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-5 space-y-4";

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40 transition-colors";

export default function CreatorAttachCommerce({
  vendorId,
  storeId,
  productIds,
  serviceIds,
  onProductsChange,
  onServicesChange,
  allowProducts = true,
  allowServices = true,
  label = "Attach commerce",
}: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [quickProduct, setQuickProduct] = useState({ name: "", price: "", category: "fashion" });
  const [quickService, setQuickService] = useState({
    title: "",
    price: "",
    duration_minutes: "60",
    category: "fitness",
    description: "",
  });

  const loadCatalog = useCallback(async () => {
    if (!vendorId && !storeId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vendorId) params.set("vendor_id", vendorId);
      if (storeId) params.set("store_id", storeId);
      const res = await fetch(`/api/vendor/catalog?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch {
      toast.error("Could not load catalog");
    } finally {
      setLoading(false);
    }
  }, [vendorId, storeId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const toggleProduct = (id: string) => {
    onProductsChange(
      productIds.includes(id) ? productIds.filter((p) => p !== id) : [...productIds, id]
    );
  };

  const toggleService = (id: string) => {
    onServicesChange(
      serviceIds.includes(id) ? serviceIds.filter((s) => s !== id) : [...serviceIds, id]
    );
  };

  const createProduct = async () => {
    if (!vendorId || !quickProduct.name.trim() || !quickProduct.price) {
      toast.error("Product name and price required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          name: quickProduct.name.trim(),
          price: Number(quickProduct.price),
          inventory: 10,
          category: quickProduct.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const created = data.product as CatalogProduct;
      setProducts((prev) => [created, ...prev]);
      onProductsChange([...productIds, created.id]);
      setQuickProduct({ name: "", price: "", category: "fashion" });
      setProductModal(false);
      toast.success("Product created & attached");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const createService = async () => {
    if (!vendorId || !quickService.title.trim() || !quickService.price) {
      toast.error("Service title and price required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          title: quickService.title.trim(),
          description: quickService.description.trim() || quickService.title.trim(),
          short_description: quickService.description.trim() || quickService.title.trim(),
          category: quickService.category,
          price: Number(quickService.price),
          duration_minutes: Number(quickService.duration_minutes) || 60,
          is_virtual: true,
          is_in_person: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const created = data.service as CatalogService;
      setServices((prev) => [created, ...prev]);
      onServicesChange([...serviceIds, created.id]);
      setQuickService({ title: "", price: "", duration_minutes: "60", category: "fitness", description: "" });
      setServiceModal(false);
      toast.success("Service created & attached");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const selectedProducts = products.filter((p) => productIds.includes(p.id));
  const selectedServices = services.filter((s) => serviceIds.includes(s.id));

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">{label}</h3>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
      </div>

      {allowProducts && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
              <Package className="w-3 h-3" /> Products
            </label>
            <button
              type="button"
              onClick={() => setProductModal(true)}
              className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Create new
            </button>
          </div>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) toggleProduct(e.target.value);
            }}
            className={inputCls}
            disabled={!vendorId}
          >
            <option value="" className="bg-black">
              Attach existing product…
            </option>
            {products
              .filter((p) => !productIds.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id} className="bg-black">
                  {p.name} — KES {Number(p.price).toLocaleString()}
                </option>
              ))}
          </select>
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-cyan-500/15 border border-cyan-500/25 text-cyan-200 px-2.5 py-1 rounded-full"
                >
                  {p.name}
                  <button type="button" onClick={() => toggleProduct(p.id)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {allowServices && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Services
            </label>
            <button
              type="button"
              onClick={() => setServiceModal(true)}
              className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Create new
            </button>
          </div>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) toggleService(e.target.value);
            }}
            className={inputCls}
            disabled={!vendorId}
          >
            <option value="" className="bg-black">
              Attach existing service…
            </option>
            {services
              .filter((s) => !serviceIds.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id} className="bg-black">
                  {s.title} — KES {Number(s.price).toLocaleString()}
                </option>
              ))}
          </select>
          {selectedServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-fuchsia-500/15 border border-fuchsia-500/25 text-fuchsia-200 px-2.5 py-1 rounded-full"
                >
                  {s.title}
                  <button type="button" onClick={() => toggleService(s.id)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {productModal && (
        <Modal title="Quick create product" onClose={() => setProductModal(false)}>
          <div className="space-y-3">
            <input
              className={inputCls}
              placeholder="Product name"
              value={quickProduct.name}
              onChange={(e) => setQuickProduct((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className={inputCls}
              type="number"
              placeholder="Price (KES)"
              value={quickProduct.price}
              onChange={(e) => setQuickProduct((p) => ({ ...p, price: e.target.value }))}
            />
            <select
              className={inputCls}
              value={quickProduct.category}
              onChange={(e) => setQuickProduct((p) => ({ ...p, category: e.target.value }))}
            >
              {["fashion", "beauty", "fitness", "wellness", "accessories"].map((c) => (
                <option key={c} value={c} className="bg-black capitalize">
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createProduct}
              disabled={creating}
              className="w-full bg-white text-black py-3 rounded-xl font-bold disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create & attach"}
            </button>
          </div>
        </Modal>
      )}

      {serviceModal && (
        <Modal title="Quick create service" onClose={() => setServiceModal(false)}>
          <div className="space-y-3">
            <input
              className={inputCls}
              placeholder="Service name"
              value={quickService.title}
              onChange={(e) => setQuickService((s) => ({ ...s, title: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Description"
              value={quickService.description}
              onChange={(e) => setQuickService((s) => ({ ...s, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                type="number"
                placeholder="Price (KES)"
                value={quickService.price}
                onChange={(e) => setQuickService((s) => ({ ...s, price: e.target.value }))}
              />
              <input
                className={inputCls}
                type="number"
                placeholder="Duration (mins)"
                value={quickService.duration_minutes}
                onChange={(e) => setQuickService((s) => ({ ...s, duration_minutes: e.target.value }))}
              />
            </div>
            <select
              className={inputCls}
              value={quickService.category}
              onChange={(e) => setQuickService((s) => ({ ...s, category: e.target.value }))}
            >
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black capitalize">
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createService}
              disabled={creating}
              className="w-full bg-white text-black py-3 rounded-xl font-bold disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create & attach"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white">{title}</h4>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
