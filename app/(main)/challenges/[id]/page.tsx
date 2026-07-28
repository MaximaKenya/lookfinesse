"use client";



import { useEffect, useMemo, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import {

  ArrowLeft,

  Flame,

  Trophy,

  Users,

  Calendar,

  ChevronRight,

  Gift,

  Target,

  CheckCircle2,

  ShoppingBag,

  CalendarCheck,

} from "lucide-react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { toast } from "sonner";



const CHALLENGE_META: Record<

  string,

  {

    title: string;

    description: string;

    category: string;

    objective: string;

    rules: string[];

    rewards: string[];

    productHrefs: { href: string; label: string }[];

    serviceHrefs: { href: string; label: string }[];

    participant_count?: number;

    end_days?: number;

  }

> = {

  c1: {

    title: "7-Day Glow Up",

    description:

      "Build a consistent skincare ritual for one week. Log daily check-ins, share progress, and climb the beauty leaderboard.",

    category: "beauty",

    objective: "Complete 7 daily skincare check-ins and post at least 3 progress updates.",

    rules: [

      "Check in once per day before midnight (EAT).",

      "Post or save at least 3 glow-up moments on the feed.",

      "Use #GlowUpChallenge on at least one post.",

      "No filters required — progress over perfection.",

    ],

    rewards: [

      "Top 10: KES 500 Glow Salon voucher",

      "Top 3: Free signature facial (Glow Salon)",

      "All finishers: Exclusive challenge badge on profile",

    ],

    productHrefs: [

      { href: "/product/demo-p2", label: "Vitamin C Serum" },

      { href: "/product/demo-p8", label: "Glass Skin Kit" },

    ],

    serviceHrefs: [{ href: "/services", label: "Book a facial" }],

    participant_count: 1240,

    end_days: 7,

  },

  "11000000-0000-4000-8000-000000000001": {

    title: "30-Day Glow Up",

    description: "Daily skincare check-ins, weekly transformation posts, and community leaderboard.",

    category: "beauty",

    objective: "Stay consistent for 30 days with daily rituals and weekly photo updates.",

    rules: [

      "Daily check-in on the challenge page.",

      "Weekly before/after post on your feed.",

      "Engage with 2 other participants each week.",

    ],

    rewards: ["Membership upgrades", "Product drops from partner brands"],

    productHrefs: [{ href: "/shop?category=beauty", label: "Shop beauty" }],

    serviceHrefs: [{ href: "/services", label: "Book spa services" }],

    participant_count: 248,

    end_days: 30,

  },

};



const DEMO_LEADERBOARD = [

  { name: "Wanjiru K.", points: 920, streak: 22 },

  { name: "Achieng O.", points: 880, streak: 19 },

  { name: "Kamau M.", points: 705, streak: 14 },

  { name: "Njeri W.", points: 640, streak: 12 },

  { name: "Ali H.", points: 530, streak: 9 },

];



export default function ChallengeDetail() {

  const { id } = useParams<{ id: string }>();

  const { userId } = useCurrentUser();

  const [challenge, setChallenge] = useState<any>(null);

  const [joined, setJoined] = useState(false);

  const [progress, setProgress] = useState(0);



  const meta = useMemo(() => (id ? CHALLENGE_META[id] : undefined), [id]);



  useEffect(() => {

    if (!id) return;

    fetch(`/api/gamification?user_id=${userId ?? "anonymous"}`)

      .then((r) => r.json())

      .then((data) => {

        const match = (data?.challenges ?? []).find(

          (c: any) => c.id === id || String(c.id).endsWith(id)

        );

        const base = meta ?? {

          title: match?.title ?? "Community Challenge",

          description: match?.description ?? "Join creators across Nairobi.",

          category: match?.category ?? "wellness",

          objective: "Complete daily actions and track your streak.",

          rules: ["Check in daily", "Share progress on the feed", "Stay respectful & supportive"],

          rewards: ["Leaderboard recognition", "Community badges"],

          productHrefs: [{ href: "/shop", label: "Shop picks" }],

          serviceHrefs: [{ href: "/services", label: "Book services" }],

        };

        setChallenge({

          ...base,

          ...match,

          participant_count: match?.participant_count ?? base.participant_count ?? 0,

          end_date:

            match?.end_date ??

            new Date(

              Date.now() + (base.end_days ?? 14) * 86400000

            ).toISOString(),

        });

        if (userId && data?.participations) {

          const p = data.participations.find(

            (x: any) => x.challenge_id === id || String(x.challenge_id).endsWith(String(id))

          );

          if (p) {

            setJoined(true);

            setProgress(Number(p.progress ?? 0));

          }

        }

      })

      .catch(() => {

        if (meta) {

          setChallenge({

            ...meta,

            end_date: new Date(

              Date.now() + (meta.end_days ?? 7) * 86400000

            ).toISOString(),

          });

        }

      });

  }, [id, userId, meta]);



  const join = async () => {

    if (!userId) {

      toast.error("Sign in to join");

      return;

    }

    const res = await fetch("/api/gamification", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ user_id: userId, challenge_id: id }),

    });

    if (res.ok) {

      setJoined(true);

      toast.success("You're in! 🏆");

    } else {

      toast.error("Couldn't join");

    }

  };



  if (!challenge) {

    return (

      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">

        <div className="h-8 w-40 bg-white/5 rounded-xl mb-4" />

        <div className="h-40 bg-white/5 rounded-3xl" />

      </div>

    );

  }



  const pct = Math.min(100, Math.round(Number(progress) * 100));



  return (

    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">

      <Link

        href="/challenges"

        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm"

      >

        <ArrowLeft className="w-4 h-4" /> Challenges

      </Link>



      <header className="relative bg-gradient-to-br from-purple-900/25 via-[#0f0f0f] to-orange-900/15 border border-purple-500/15 rounded-3xl p-6 sm:p-8 overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">

          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">

            <Trophy className="w-7 h-7 text-yellow-400" />

          </div>

          <div className="flex-1 min-w-0 space-y-2">

            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25 capitalize">

              {challenge.category}

            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">{challenge.title}</h1>

            <p className="text-white/60 leading-relaxed text-sm sm:text-base">

              {challenge.description}

            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 pt-1">

              <span className="flex items-center gap-1">

                <Users className="w-3 h-3" /> {challenge.participant_count ?? 0} joined

              </span>

              {challenge.end_date && (

                <span className="flex items-center gap-1">

                  <Calendar className="w-3 h-3" /> Ends{" "}

                  {new Date(challenge.end_date).toLocaleDateString()}

                </span>

              )}

            </div>

          </div>

          <div className="shrink-0 self-start">

            {!joined ? (

              <button

                onClick={join}

                className="w-full sm:w-auto bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/90"

              >

                Join challenge

              </button>

            ) : (

              <div className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full text-center">

                ✓ Joined

              </div>

            )}

          </div>

        </div>

      </header>



      <section className="grid sm:grid-cols-2 gap-4">

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">

          <div className="flex items-center gap-2 text-white font-semibold">

            <Target className="w-4 h-4 text-purple-400" /> Objective

          </div>

          <p className="text-sm text-white/65 leading-relaxed">{challenge.objective}</p>

        </div>

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">

          <div className="flex items-center gap-2 text-white font-semibold">

            <Gift className="w-4 h-4 text-amber-400" /> Rewards

          </div>

          <ul className="text-sm text-white/65 space-y-1.5">

            {(challenge.rewards ?? []).map((r: string) => (

              <li key={r} className="flex gap-2">

                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />

                {r}

              </li>

            ))}

          </ul>

        </div>

      </section>



      <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">

        <h2 className="font-bold text-white">Rules</h2>

        <ol className="list-decimal list-inside text-sm text-white/60 space-y-1.5">

          {(challenge.rules ?? []).map((rule: string) => (

            <li key={rule}>{rule}</li>

          ))}

        </ol>

      </section>



      {joined && (

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">

          <div className="flex items-center justify-between gap-3">

            <p className="text-sm font-semibold text-white">Your progress</p>

            <p className="text-2xl font-bold text-white flex items-center gap-1">

              <Flame className="w-5 h-5 text-orange-400" /> {pct}%

            </p>

          </div>

          <div className="h-2 bg-white/5 rounded-full overflow-hidden">

            <div

              className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"

              style={{ width: `${pct}%` }}

            />

          </div>

          <div className="flex flex-wrap gap-2 pt-1">

            <Link

              href="/feed"

              className="text-xs font-semibold bg-white/10 border border-white/15 px-3 py-2 rounded-xl hover:bg-white/15"

            >

              Post update

            </Link>

            <Link

              href={`/challenges/${id}/leaderboard`}

              className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 px-3 py-2"

            >

              View leaderboard <ChevronRight className="w-4 h-4" />

            </Link>

          </div>

        </div>

      )}



      <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold text-white">Top participants</h2>

          <Link

            href={`/challenges/${id}/leaderboard`}

            className="text-xs text-purple-400 hover:text-purple-300"

          >

            Full leaderboard →

          </Link>

        </div>

        <ol className="space-y-2">

          {DEMO_LEADERBOARD.map((row, i) => (

            <li

              key={row.name}

              className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3"

            >

              <span

                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${

                  i === 0

                    ? "bg-yellow-400/20 text-yellow-300"

                    : i === 1

                      ? "bg-zinc-300/20 text-zinc-100"

                      : i === 2

                        ? "bg-orange-400/20 text-orange-300"

                        : "bg-white/5 text-white/60"

                }`}

              >

                {i + 1}

              </span>

              <span className="flex-1 font-medium text-white">{row.name}</span>

              <span className="text-xs text-white/40">🔥 {row.streak}d</span>

              <span className="text-sm font-bold text-white">{row.points}</span>

            </li>

          ))}

        </ol>

      </section>



      <section className="grid sm:grid-cols-2 gap-4">

        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-white/8 rounded-3xl p-5 space-y-3">

          <div className="flex items-center gap-2 font-semibold text-white">

            <ShoppingBag className="w-4 h-4 text-purple-300" /> Related products

          </div>

          <div className="flex flex-wrap gap-2">

            {(challenge.productHrefs ?? []).map((p: { href: string; label: string }) => (

              <Link

                key={p.href}

                href={p.href}

                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"

              >

                {p.label}

              </Link>

            ))}

          </div>

        </div>

        <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/10 border border-white/8 rounded-3xl p-5 space-y-3">

          <div className="flex items-center gap-2 font-semibold text-white">

            <CalendarCheck className="w-4 h-4 text-cyan-300" /> Related services

          </div>

          <div className="flex flex-wrap gap-2">

            {(challenge.serviceHrefs ?? []).map((p: { href: string; label: string }) => (

              <Link

                key={p.href}

                href={p.href}

                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"

              >

                {p.label}

              </Link>

            ))}

          </div>

        </div>

      </section>



      <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-3">

        <h2 className="text-lg font-bold text-white">Related challenges</h2>

        <div className="flex flex-wrap gap-2">

          <Link

            href="/challenges/c1"

            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${

              id === "c1"

                ? "bg-purple-500/20 border-purple-500/30 text-purple-200"

                : "bg-white/10 border-white/15 hover:bg-white/15 text-white/80"

            }`}

          >

            7-Day Glow Up

          </Link>

          <Link

            href="/challenges"

            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white/80"

          >

            Browse all challenges

          </Link>

        </div>

      </section>



      {!joined && (

        <div className="text-center">

          <button

            onClick={join}

            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90"

          >

            <Trophy className="w-4 h-4" /> Join & start today

          </button>

        </div>

      )}

    </div>

  );

}

