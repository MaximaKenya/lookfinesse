"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Package,
  Sparkles,
  Tag,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";

import VendorProductsList from "@/components/vendor/VendorProductsList";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id: string;
  url: string;
}

export default function VendorProductStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [images, setImages] = useState<ProductImage[]>([]);

  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    category_id: "",
    price: "",
    compare_price: "",
    inventory: "",
    sku: "",
    weight: "",
    shipping_fee: "",
    status: "draft",
  });

  async function loadCategories() {
    try {
      const res = await fetch(
        "/api/vendor/product-categories"
      );

      const json = await res.json();

      setCategories(json.categories || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function updateField(
    field: string,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const mapped = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mapped]);
  }

  async function createProduct() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/vendor/create-product",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            images,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to create product"
        );
      }

      alert("Product created successfully");

      setForm({
        name: "",
        short_description: "",
        description: "",
        category_id: "",
        price: "",
        compare_price: "",
        inventory: "",
        sku: "",
        weight: "",
        shipping_fee: "",
        status: "draft",
      });

      setImages([]);
    } catch (err) {
      console.error(err);

      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  const estimatedProfit = useMemo(() => {
    const price = Number(form.price || 0);

    const shipping = Number(
      form.shipping_fee || 0
    );

    return price - shipping;
  }, [form.price, form.shipping_fee]);

  const productHealth = useMemo(() => {
    let score = 0;

    if (form.name.length > 5) score += 20;

    if (form.description.length > 50)
      score += 20;

    if (images.length >= 3) score += 20;

    if (form.price) score += 20;

    if (form.inventory) score += 20;

    return score;
  }, [form, images]);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Product Studio</h1>
          <p className="text-zinc-500 text-sm mt-1">Create and manage your marketplace products</p>
        </div>
    <VendorProductsList />
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* LEFT */}
      <div className="xl:col-span-2 space-y-6">

        {/* BASIC INFO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Product Studio 2.0
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Create intelligent marketplace products
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
              LIVE COMMERCE ENGINE
            </div>
          </div>

          <div className="space-y-6">

            <div>
              <label className="text-sm text-zinc-400 mb-3 block">
                Product Name
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                placeholder="Premium Wireless Headphones"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-3 block">
                Short Description
              </label>

              <input
                value={form.short_description}
                onChange={(e) =>
                  updateField(
                    "short_description",
                    e.target.value
                  )
                }
                placeholder="Short customer-facing description"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-3 block">
                Full Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe materials, features, warranty, sizing, use cases, customer benefits and premium details..."
                className="w-full min-h-[220px] rounded-3xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500 p-5 resize-none"
              />
            </div>

          </div>
        </div>

        {/* MEDIA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Product Media Carousel
              </h2>

              <p className="text-zinc-500 mt-2">
                Upload multiple product images for realtime carousel rendering.
              </p>
            </div>

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="h-12 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-all text-black font-bold flex items-center gap-3"
            >
              <Upload size={18} />
              Upload Images
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {images.map((image) => (
              <div
                key={image.id}
                className="aspect-square rounded-3xl overflow-hidden border border-zinc-800 bg-black"
              >
                <img
                  src={image.url}
                  alt="product"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="aspect-square rounded-3xl border border-dashed border-zinc-700 hover:border-cyan-500 bg-black flex flex-col items-center justify-center text-zinc-500 hover:text-cyan-400 transition-all"
            >
              <ImagePlus size={40} />

              <div className="mt-3 text-sm">
                Add Images
              </div>
            </button>

          </div>
        </div>

        {/* INVENTORY + SHIPPING */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-5">

            <div className="flex items-center gap-3 mb-4">
              <Package className="text-cyan-400" />

              <h2 className="text-2xl font-bold">
                Inventory Engine
              </h2>
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                Inventory Quantity
              </label>

              <input
                value={form.inventory}
                onChange={(e) =>
                  updateField(
                    "inventory",
                    e.target.value
                  )
                }
                type="number"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                SKU
              </label>

              <input
                value={form.sku}
                onChange={(e) =>
                  updateField(
                    "sku",
                    e.target.value
                  )
                }
                placeholder="SKU-001"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                Category
              </label>

              <select
                value={form.category_id}
                onChange={(e) =>
                  updateField(
                    "category_id",
                    e.target.value
                  )
                }
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="">
                  Select Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-5">

            <div className="flex items-center gap-3 mb-4">
              <Truck className="text-green-400" />

              <h2 className="text-2xl font-bold">
                Pricing & Shipping
              </h2>
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                Product Price
              </label>

              <input
                value={form.price}
                onChange={(e) =>
                  updateField(
                    "price",
                    e.target.value
                  )
                }
                type="number"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                Compare Price
              </label>

              <input
                value={form.compare_price}
                onChange={(e) =>
                  updateField(
                    "compare_price",
                    e.target.value
                  )
                }
                type="number"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-3">
                Shipping Fee
              </label>

              <input
                value={form.shipping_fee}
                onChange={(e) =>
                  updateField(
                    "shipping_fee",
                    e.target.value
                  )
                }
                type="number"
                className="w-full h-14 px-5 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-6">

        {/* HEALTH */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">

          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-green-400" />

            <h2 className="text-2xl font-bold">
              Product Health
            </h2>
          </div>

          <div className="relative h-4 rounded-full bg-black overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              style={{
                width: `${productHealth}%`,
              }}
            />
          </div>

          <div className="text-5xl font-black mt-6 text-white">
            {productHealth}%
          </div>

          <div className="text-zinc-500 mt-2">
            AI marketplace readiness score
          </div>

        </div>

        {/* AI INSIGHTS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">

          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-yellow-400" />

            <h2 className="text-2xl font-bold">
              AI Insights
            </h2>
          </div>

          <div className="space-y-4 text-sm">

            {images.length < 3 && (
              <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-4 text-yellow-300">
                Add at least 3 images to improve product conversion.
              </div>
            )}

            {!form.description && (
              <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-red-300">
                Missing detailed description.
              </div>
            )}

            {form.price && (
              <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-4 text-green-300">
                Pricing structure looks competitive.
              </div>
            )}

          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">

          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-cyan-400" />

            <h2 className="text-2xl font-bold">
              Revenue Projection
            </h2>
          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">
                Estimated Margin
              </span>

              <span className="text-green-400 font-bold">
                KES {estimatedProfit.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">
                Inventory Capacity
              </span>

              <span className="text-cyan-400 font-bold">
                {form.inventory || 0} units
              </span>
            </div>

          </div>

          <button
            onClick={createProduct}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-all text-black font-black mt-8"
          >
            {loading
              ? "Creating Product..."
              : "Launch Product"}
          </button>

        </div>

      </div>

    </section>
      </div>
    </main>
  );
}
