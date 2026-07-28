"use client";

import { useState } from "react";

export default function VendorProductStudio() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);

  async function createProduct() {
    try {
      setLoading(true);

      const res = await fetch("/api/vendor/products/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to create product");
      }

      alert("Product created successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white">
          Vendor Product Studio
        </h1>

        <p className="text-zinc-400 mt-3">
          AI-powered commerce product management
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <input
          placeholder="Product Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
          className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
        />
      </div>

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        className="bg-black border border-zinc-700 rounded-2xl p-4 text-white min-h-[180px]"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <input
          placeholder="Price"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
        />

        <input
          placeholder="Inventory"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: e.target.value })
          }
          className="bg-black border border-zinc-700 rounded-2xl p-4 text-white"
        />
      </div>

      <button
        onClick={createProduct}
        disabled={loading}
        className="bg-green-600 hover:bg-green-500 px-6 py-4 rounded-2xl font-bold text-white"
      >
        {loading ? "Creating..." : "Create Product"}
      </button>
    </div>
  );
}

