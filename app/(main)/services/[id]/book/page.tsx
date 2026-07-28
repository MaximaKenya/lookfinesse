"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import CapacityMeter from "@/components/bookings/CapacityMeter";

export default function BookServicePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [service, setService] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [capacity, setCapacity] = useState<{ bookedSpots: number; maxSpots: number; isFull: boolean } | null>(null);
  const fromCreator = search.get("creator") ?? search.get("from_creator");

  useEffect(() => {
    Promise.all([
      fetch(`/api/services/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/availability?service_id=${id}`).then((r) => r.json()),
      fetch(`/api/services/${id}/capacity`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([svc, av, cap]) => {
      setService(svc);
      const list = Array.isArray(av) ? av : [];
      setSlots(list);
      if (list[0]) setSelectedSlot(list[0].id);
      if (cap && typeof cap.bookedSpots === "number") {
        setCapacity({ bookedSpots: cap.bookedSpots, maxSpots: cap.maxSpots, isFull: cap.isFull });
      }
    });
  }, [id]);

  const submit = async () => {
    if (!userId) {
      toast.error("Sign in to book");
      router.push(`/login?returnUrl=/services/${id}/book`);
      return;
    }
    if (capacity?.isFull) {
      toast.error("This session is fully booked");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        vendor_id: service?.vendor_id,
        service_id: id,
        availability_slot_id: selectedSlot,
        participants,
        notes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (res.ok) {
      toast.success("Booking created — complete payment");
      router.push(data.checkoutUrl ?? `/checkout?booking_id=${data.id ?? data.booking?.id}`);
    } else {
      toast.error(data.error ?? "Booking failed — try again");
    }
  };

  if (!service) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-white/40">Loading service…</div>
    );
  }

  const vendor = service.vendors ?? {};
  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 text-white">
      <Link
        href={fromCreator ? `/creator/${fromCreator}` : `/services/${id}`}
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <header className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 flex gap-4">
        {service.cover_image && (
          <img src={service.cover_image} className="w-20 h-20 rounded-2xl object-cover shrink-0" alt="" />
        )}
        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-widest">Booking</p>
          <h1 className="text-xl font-bold leading-tight">{service.title}</h1>
          <p className="text-sm text-white/50">
            with <span className="text-white">{vendor.business_name || vendor.name || "Creator"}</span> · KES {Number(service.price ?? 0).toLocaleString()}
          </p>
        </div>
      </header>

      {capacity && (
        <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5">
          <CapacityMeter booked={capacity.bookedSpots} max={capacity.maxSpots} />
        </section>
      )}

      {/* Slots */}
      <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" /> Pick a time
        </h2>
        {slots.length === 0 ? (
          <p className="text-white/40 text-sm">
            No live slots yet — the creator will confirm a time after booking.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`p-3 rounded-xl border text-xs font-medium text-left ${
                  selectedSlot === slot.id
                    ? "bg-white text-black border-white"
                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
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
        )}
      </section>

      {/* Details */}
      <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3 h-3" /> Participants
          </label>
          <input
            type="number"
            min={1}
            max={service.max_participants ?? 10}
            value={participants}
            onChange={(e) => setParticipants(Math.max(1, Number(e.target.value)))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the creator should know?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
          />
        </div>
      </section>

      <button
        onClick={submit}
        disabled={submitting || capacity?.isFull}
        className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : capacity?.isFull ? "Fully booked" : "Confirm booking"}
      </button>
      <p className="text-center text-[11px] text-white/30">You'll receive a notification after the creator confirms.</p>
    </div>
  );
}
