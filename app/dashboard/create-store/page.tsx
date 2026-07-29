"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Phone,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-600 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all";

const textareaCls =
  "w-full px-4 py-3 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-600 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none";

export default function CreateStorePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return router.push("/login");
    if (!name) return alert("Store name required");

    setLoading(true);

    const lat = Number(latitude);
    const lng = Number(longitude);

    const { error } = await supabase.from("stores").insert([
      {
        name,
        description,
        user_id: data.user.id,
        ownerName,
        phone,
        city,
        address,
        latitude: lat || null,
        longitude: lng || null,
        location: lat && lng ? `POINT(${lng} ${lat})` : null,
      },
    ]);

    setLoading(false);

    if (error) return alert(error.message);

    // Start 30-day Pro trial on first vendor store (idempotent)
    try {
      await fetch("/api/platform-subscriptions");
    } catch {
      /* non-blocking */
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-all"
          >
            <ArrowLeft size={18} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Launch Your Store
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Set up your vendor storefront on the marketplace
            </p>
          </div>
        </div>

        {/* Hero banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-zinc-800 rounded-[32px] p-8">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 blur-3xl rounded-full" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Store className="text-cyan-400" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-cyan-400" size={14} />
                <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">
                  Vendor Onboarding
                </span>
              </div>
              <h2 className="text-2xl font-bold">Store Creation Studio</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Your store goes live instantly. Start selling in minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Left — Core Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Building2 className="text-cyan-400" size={18} />
              </div>
              <h3 className="text-xl font-bold">Store Identity</h3>
            </div>

            <Field label="Store Name *">
              <input
                placeholder="e.g. Glow Beauty Studio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Owner / Brand Name">
              <input
                placeholder="Your name or brand"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                placeholder="Tell customers what makes your store unique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={textareaCls}
              />
            </Field>
          </div>

          {/* Right — Contact + Location */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Phone className="text-green-400" size={18} />
                </div>
                <h3 className="text-xl font-bold">Contact</h3>
              </div>

              <Field label="Phone Number">
                <input
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <MapPin className="text-purple-400" size={18} />
                </div>
                <h3 className="text-xl font-bold">Location</h3>
              </div>

              <Field label="City">
                <input
                  placeholder="Nairobi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Address">
                <input
                  placeholder="Westlands Rd, Nairobi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input
                    type="number"
                    placeholder="-1.2921"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    placeholder="36.8219"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <p className="text-xs text-zinc-600 flex items-center gap-1">
                <Globe size={12} />
                Optional: enables nearby discovery on the map
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="h-14 px-10 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-black font-black text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Store size={20} />
                Launch Store
              </>
            )}
          </button>
        </div>

      </div>
    </main>
  );
}
