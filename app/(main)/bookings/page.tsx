"use client";



import { useEffect, useState } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import Link from "next/link";

import {

  Calendar,

  CheckCircle,

  Clock,

  ChevronRight,

  Sparkles,

  MapPin,

  CreditCard,

  Video,

  XCircle,

  Loader2,

} from "lucide-react";

import Pagination, { getPageSlice } from "@/components/ui/Pagination";

import SearchInput from "@/components/ui/SearchInput";

import { toast } from "sonner";



const STATUS_STYLES: Record<string, string> = {

  confirmed: "text-green-400 bg-green-400/10 border-green-400/20",

  pending_payment: "text-amber-400 bg-amber-400/10 border-amber-400/20",

  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",

  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",

  completed: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",

};



const PAYMENT_STYLES: Record<string, string> = {

  paid: "text-green-400",

  pending: "text-amber-400",

  failed: "text-red-400",

};



const FILTERS = ["all", "pending_payment", "confirmed", "completed", "cancelled"] as const;



export default function BookingsPage() {

  const { userId } = useCurrentUser();

  const [bookings, setBookings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<string>("all");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;



  const loadBookings = () => {

    if (!userId) return;

    setLoading(true);

    fetch(`/api/bookings?user_id=${userId}`)

      .then((r) => r.json())

      .then((data) => setBookings(Array.isArray(data) ? data : []))

      .catch(() => setBookings([]))

      .finally(() => setLoading(false));

  };



  useEffect(() => {

    loadBookings();

  }, [userId]);



  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    if (params.get("paid") === "pending") {

      toast.info("Complete the M-Pesa prompt on your phone. Refresh when done.");

    }

  }, []);



  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const filtered =

    filter === "all"

      ? safeBookings

      : safeBookings.filter((b) => b.status === filter);



  const searched = search.trim()

    ? filtered.filter((b) => {

        const q = search.toLowerCase();

        return (

          (b.services?.title ?? "").toLowerCase().includes(q) ||

          (b.vendors?.name ?? "").toLowerCase().includes(q) ||

          (b.status ?? "").toLowerCase().includes(q)

        );

      })

    : filtered;



  const { slice: pagedBookings, totalPages, safePage } = getPageSlice(

    searched,

    page,

    PAGE_SIZE

  );



  useEffect(() => {

    setPage(1);

  }, [filter, search]);



  const unpaidCount = safeBookings.filter(

    (b) => b.payment_status === "pending" && b.status !== "cancelled"

  ).length;



  return (

    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">

      <header className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-cyan-950/40 via-[#0f0f0f] to-purple-950/30 p-6">

        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-[60px] pointer-events-none" />

        <div className="relative">

          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80 mb-2">

            <Sparkles className="w-3 h-3" />

            Appointments

          </div>

          <h1 className="text-3xl font-bold text-white">My Bookings</h1>

          <p className="text-white/40 text-sm mt-1">

            Salon, fitness & wellness sessions

          </p>

          {unpaidCount > 0 && (

            <p className="text-amber-300/90 text-xs mt-2 font-medium">

              {unpaidCount} booking{unpaidCount > 1 ? "s" : ""} awaiting payment

            </p>

          )}

        </div>

      </header>



      <SearchInput onChange={setSearch} placeholder="Search bookings, services…" />



      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

        {FILTERS.map((s) => (

          <button

            key={s}

            type="button"

            onClick={() => setFilter(s)}

            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all ${

              filter === s

                ? "bg-white text-black"

                : "bg-white/5 text-white/50 border border-white/8"

            }`}

          >

            {s === "pending_payment" ? "Awaiting pay" : s}

            {s !== "all" && (

              <span className="ml-1 opacity-60">

                ({safeBookings.filter((b) => b.status === s).length})

              </span>

            )}

          </button>

        ))}

      </div>



      {!userId && (

        <div className="text-center py-16 space-y-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">

          <Calendar className="w-12 h-12 text-white/20 mx-auto" />

          <p className="text-white/40">Sign in to view your bookings</p>

          <Link

            href="/login?returnUrl=/bookings"

            className="inline-block bg-gradient-to-r from-amber-500/90 to-rose-500/90 text-black px-6 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all"

          >

            Sign In

          </Link>

        </div>

      )}



      {userId && loading && (

        <div className="space-y-3">

          {[1, 2, 3].map((i) => (

            <div

              key={i}

              className="h-32 rounded-3xl bg-white/5 animate-pulse border border-white/5"

            />

          ))}

        </div>

      )}



      {userId && !loading && (

        <div className="space-y-3">

          {pagedBookings.map((b) => {

            const unpaid = b.payment_status === "pending" && b.status !== "cancelled";

            const slotTime = b.availability_slots?.starts_at;

            return (

              <div

                key={b.id}

                className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-5 hover:border-white/15 transition-all space-y-4"

              >

                <div className="flex items-start gap-4">

                  {b.services?.cover_image && (

                    <img

                      src={b.services.cover_image}

                      alt=""

                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-white/10"

                    />

                  )}

                  <div className="flex-1 min-w-0">

                    <h3 className="font-bold text-white truncate">

                      {b.services?.title ?? "Service"}

                    </h3>

                    <p className="text-sm text-white/40 mt-0.5 truncate">

                      {b.vendors?.business_name ?? b.vendors?.name ?? "Vendor"}

                    </p>



                    <div className="flex flex-wrap items-center gap-2 mt-3">

                      <span

                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? "text-white/50 bg-white/5 border-white/10"}`}

                      >

                        <CheckCircle className="w-3 h-3" />

                        {b.status === "pending_payment" ? "Awaiting payment" : b.status}

                      </span>

                      <span className={`text-[11px] font-semibold capitalize ${PAYMENT_STYLES[b.payment_status] ?? "text-white/40"}`}>

                        {b.payment_status}

                      </span>

                      {slotTime && (

                        <span className="flex items-center gap-1 text-xs text-white/30">

                          <Clock className="w-3 h-3" />

                          {new Date(slotTime).toLocaleDateString(undefined, {

                            weekday: "short",

                            month: "short",

                            day: "numeric",

                            hour: "2-digit",

                            minute: "2-digit",

                          })}

                        </span>

                      )}

                      {b.services?.category && (

                        <span className="text-[10px] text-white/30 capitalize bg-white/5 px-2 py-0.5 rounded-full">

                          {b.services.category}

                        </span>

                      )}

                    </div>

                  </div>

                  <div className="text-right shrink-0">

                    <p className="font-bold text-white">

                      KES {Number(b.total_amount ?? 0).toLocaleString()}

                    </p>

                    {b.participants > 1 && (

                      <p className="text-[10px] text-white/30">{b.participants} people</p>

                    )}

                  </div>

                </div>



                <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">

                  {unpaid && (

                    <Link

                      href={`/checkout?booking_id=${b.id}`}

                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90"

                    >

                      <CreditCard className="w-3.5 h-3.5" />

                      Pay now

                    </Link>

                  )}

                  <Link

                    href={`/services/${b.service_id}`}

                    className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white border border-white/10 px-3 py-2 rounded-xl"

                  >

                    View service <ChevronRight className="w-3 h-3" />

                  </Link>

                  {b.services?.category === "fitness" && (

                    <Link

                      href="/live"

                      className="inline-flex items-center gap-1 text-xs text-cyan-300/80 hover:text-cyan-200 border border-cyan-500/20 px-3 py-2 rounded-xl"

                    >

                      <Video className="w-3 h-3" /> Live classes

                    </Link>

                  )}

                  <button

                    type="button"

                    onClick={loadBookings}

                    className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white px-3 py-2 rounded-xl"

                  >

                    <Loader2 className="w-3 h-3" /> Refresh

                  </button>

                </div>

              </div>

            );

          })}



          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />



          {filtered.length === 0 && (

            <div className="text-center py-16 space-y-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">

              <Calendar className="w-10 h-10 text-white/15 mx-auto" />

              <p className="text-white/30 text-sm">No bookings yet</p>

              <p className="text-white/20 text-xs max-w-xs mx-auto">

                Book a fitness class, salon treatment, or wellness session

              </p>

              <Link

                href="/services"

                className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm"

              >

                <MapPin className="w-4 h-4" />

                Explore services

              </Link>

            </div>

          )}

        </div>

      )}

    </div>

  );

}

