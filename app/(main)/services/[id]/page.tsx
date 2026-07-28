"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Clock3, MapPin, Video, Star, Users, Calendar,
  ArrowLeft, BadgeCheck, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ServicePlansSubscribe from "@/components/services/ServicePlansSubscribe";
import CapacityMeter from "@/components/bookings/CapacityMeter";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [service, setService] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [capacity, setCapacity] = useState<{ bookedSpots: number; maxSpots: number; isFull: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/services/${id}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/availability?service_id=${id}`).then((r) => r.json()),
      fetch(`/api/services/${id}/capacity`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([svc, availSlots, cap]) => {
      if (!svc || svc.error) {
        setNotFound(true);
      } else {
        setService(svc);
      }
      setSlots(Array.isArray(availSlots) ? availSlots : []);
      if (cap && typeof cap.bookedSpots === "number") {
        setCapacity({ bookedSpots: cap.bookedSpots, maxSpots: cap.maxSpots, isFull: cap.isFull });
      }
    });
  }, [id]);

  const book = async () => {
    if (!userId) { toast.error("Sign in to book"); router.push("/login?returnUrl=/bookings"); return; }
    if (!selectedSlot && slots.length > 0) { toast.error("Select a time slot"); return; }
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        vendor_id: service.vendor_id,
        service_id: service.id,
        availability_slot_id: selectedSlot,
        participants: 1,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Booking created — complete payment");
      router.push(data.checkoutUrl ?? `/checkout?booking_id=${data.id ?? data.booking?.id}`);
    } else {
      toast.error(data.error ?? "Booking failed — try again");
    }
  };

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="text-5xl">📅</div>
        <p className="text-white font-semibold text-xl">Service not found</p>
        <p className="text-white/40 text-sm">This service may have been removed or the link is invalid.</p>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-white/90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Services
        </Link>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="aspect-video bg-white/5 rounded-3xl" />
        <div className="h-10 bg-white/5 rounded-2xl w-2/3" />
        <div className="h-6 bg-white/5 rounded-xl w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-8 bg-white/5 rounded-full" />
          <div className="h-8 bg-white/5 rounded-full" />
          <div className="h-8 bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  const vendor = service.vendors;
  const categoryColor: Record<string, string> = {
    fitness: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    beauty: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    wellness: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    style: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  const catStyle = categoryColor[service.category] ?? "text-white/60 bg-white/5 border-white/10";

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <Link href="/services" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Services
      </Link>

      {/* Cover image */}
      {service.cover_image && (
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
          <img src={service.cover_image} alt={service.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Category pill on image */}
          <div className="absolute bottom-4 left-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border capitalize ${catStyle}`}>
              {service.category}
            </span>
          </div>
          {service.bookings_count > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
              <Users className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/70">{service.bookings_count} bookings</span>
            </div>
          )}
        </div>
      )}

      {/* Vendor info */}
      {vendor && (
        <Link href={`/creator/${vendor.id}`} className="flex items-center gap-3 group">
          <img
            src={vendor.avatar_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${vendor.name ?? vendor.business_name}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
              {vendor.name ?? vendor.business_name}
              <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
            </p>
            {vendor.location && (
              <p className="text-xs text-white/40 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {vendor.location}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Title + price */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white leading-tight">{service.title}</h1>
            {service.short_description && (
              <p className="text-white/50 mt-2 text-base leading-relaxed">{service.short_description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-white">KES {service.price?.toLocaleString()}</p>
            <p className="text-xs text-white/30 mt-1">per session</p>
            {service.rating && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-yellow-400 font-semibold">{service.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2">
          {service.duration_minutes && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-sm text-white/60">
              <Clock3 className="w-4 h-4" />
              {service.duration_minutes} mins
            </div>
          )}
          {service.is_virtual && (
            <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1.5 text-sm text-cyan-400">
              <Video className="w-4 h-4" /> Virtual
            </div>
          )}
          {service.is_in_person && (
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5 text-sm text-purple-400">
              <MapPin className="w-4 h-4" /> In Person
            </div>
          )}
          {service.max_participants && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-sm text-white/60">
              <Users className="w-4 h-4" /> Max {service.max_participants}
            </div>
          )}
        </div>

        {/* Full description */}
        {service.description && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-white/70 leading-relaxed text-sm">{service.description}</p>
          </div>
        )}
      </div>

      {/* Capacity */}
      {capacity && (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5">
          <CapacityMeter booked={capacity.bookedSpots} max={capacity.maxSpots} />
        </div>
      )}

      {/* Available slots */}
      {slots.length > 0 && (
        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Available Times
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`p-3 rounded-2xl border text-sm font-medium transition-all text-left ${
                  selectedSlot === slot.id
                    ? "bg-white text-black border-white shadow-lg"
                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white hover:bg-white/5"
                }`}
              >
                {new Date(slot.starts_at).toLocaleString("en-KE", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </button>
            ))}
          </div>
        </div>
      )}

      <ServicePlansSubscribe vendorId={service.vendor_id} serviceId={service.id} />

      {/* Social proof */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Bookings", value: service.bookings_count ?? "0", icon: ShoppingBag },
          { label: "Duration", value: `${service.duration_minutes ?? "—"} min`, icon: Clock3 },
          { label: "Format", value: service.is_virtual ? "Online" : "In person", icon: Video },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 text-center">
            <Icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{value}</p>
            <p className="text-white/30 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Book CTA */}
      <div className="sticky bottom-4">
        <button
          onClick={book}
          disabled={loading || capacity?.isFull}
          className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-white/90 disabled:opacity-60 transition-all shadow-xl shadow-white/10"
        >
          {capacity?.isFull ? "Fully booked" : loading ? "Booking..." : slots.length > 0 && !selectedSlot ? "Select a Time Slot" : "Book Now →"}
        </button>
        <p className="text-center text-xs text-white/25 mt-2">No payment until confirmed</p>
      </div>
    </section>
  );
}
