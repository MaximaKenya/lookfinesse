"use client";



/**

 * Post-signup onboarding flow (elite shopper path)

 *

 * Register (email or Google) → /auth/callback → /onboarding if preferences incomplete

 * Steps: Gender → Age group → Interests → Budget → Style → City

 * Finish → PATCH /api/profile → /feed

 *

 * Returning users with onboarded_at or full preferences skip to /feed (see lib/auth/onboarding.ts).

 */



import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { Sparkles, Shirt, Flower2, Dumbbell, Heart, ChevronRight, Check } from "lucide-react";

import { toast } from "sonner";

import BrandLogo from "@/components/brand/BrandLogo";



type Interest = "fashion" | "beauty" | "fitness" | "wellness" | "grooming" | "nutrition";

type Budget = "saver" | "mid" | "premium";

type Style = "classic" | "streetwear" | "afrocentric" | "minimal" | "bold";

type Gender = "female" | "male" | "non_binary" | "prefer_not";

type AgeGroup = "18-24" | "25-34" | "35-44" | "45-54" | "55+";



const GENDERS: { id: Gender; label: string }[] = [

  { id: "female", label: "Woman" },

  { id: "male", label: "Man" },

  { id: "non_binary", label: "Non-binary" },

  { id: "prefer_not", label: "Prefer not to say" },

];



const AGE_GROUPS: { id: AgeGroup; label: string }[] = [

  { id: "18-24", label: "18–24" },

  { id: "25-34", label: "25–34" },

  { id: "35-44", label: "35–44" },

  { id: "45-54", label: "45–54" },

  { id: "55+", label: "55+" },

];



const INTERESTS: { id: Interest; label: string; icon: typeof Shirt }[] = [

  { id: "fashion", label: "Fashion", icon: Shirt },

  { id: "beauty", label: "Beauty", icon: Flower2 },

  { id: "fitness", label: "Fitness", icon: Dumbbell },

  { id: "wellness", label: "Wellness", icon: Heart },

  { id: "grooming", label: "Grooming", icon: Sparkles },

  { id: "nutrition", label: "Nutrition", icon: Sparkles },

];



const BUDGETS: { id: Budget; label: string; sub: string }[] = [

  { id: "saver", label: "Budget-savvy", sub: "Under KES 3,000 picks" },

  { id: "mid", label: "Mid-range", sub: "KES 3,000 — 10,000" },

  { id: "premium", label: "Premium", sub: "KES 10,000+ curated" },

];



const STYLES: { id: Style; label: string }[] = [

  { id: "classic", label: "Classic" },

  { id: "streetwear", label: "Streetwear" },

  { id: "afrocentric", label: "Afrocentric" },

  { id: "minimal", label: "Minimal" },

  { id: "bold", label: "Bold & Statement" },

];



const STEPS = ["Gender", "Age", "Interests", "Budget", "Style", "Locale"] as const;



export default function OnboardingPage() {

  const router = useRouter();

  const { userId, loading } = useCurrentUser();



  const [step, setStep] = useState(0);

  const [gender, setGender] = useState<Gender | null>(null);

  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);

  const [interests, setInterests] = useState<Interest[]>([]);

  const [budget, setBudget] = useState<Budget | null>(null);

  const [style, setStyle] = useState<Style | null>(null);

  const [city, setCity] = useState("Nairobi");

  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {

    if (!loading && !userId) router.push("/login?returnUrl=/onboarding");

  }, [loading, userId, router]);



  const toggleInterest = (i: Interest) => {

    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  };



  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const back = () => setStep((s) => Math.max(s - 1, 0));



  const finish = async () => {

    if (!userId) return;

    setSubmitting(true);

    try {

      const res = await fetch("/api/profile", {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          city,

          preferences: {

            gender,

            age_group: ageGroup,

            interests,

            budget,

            style,

            city,

          },

          onboarded_at: new Date().toISOString(),

        }),

      });

      if (!res.ok) {

        const err = await res.json();

        throw new Error(err.error ?? "Save failed");

      }

      await Promise.all(

        interests.map((cat) =>

          fetch("/api/behavior", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

              user_id: userId,

              entity_type: "preference",

              event_type: "select",

              category: cat,

            }),

          }).catch(() => {})

        )

      );

      toast.success("Profile personalized!");

      router.push("/feed");

    } catch (e) {

      toast.error(e instanceof Error ? e.message : "Couldn't save — try again");

    } finally {

      setSubmitting(false);

    }

  };



  const canAdvance =

    (step === 0 && !!gender) ||

    (step === 1 && !!ageGroup) ||

    (step === 2 && interests.length > 0) ||

    (step === 3 && !!budget) ||

    (step === 4 && !!style) ||

    step === 5;



  return (

    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      <div className="flex justify-center">

        <BrandLogo href="/feed" size="sm" />

      </div>

      <div className="text-center space-y-2">

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">

          <Sparkles className="w-3.5 h-3.5" />

          Personalize LookFinesse

        </div>

        <h1 className="text-3xl font-bold text-white">Tell us what you love</h1>

        <p className="text-sm text-white/40">

          Powers your feed ranking, ads, and Today on LookFinesse tips.

        </p>

      </div>



      <div className="flex items-center gap-2">

        {STEPS.map((label, i) => (

          <div key={label} className="flex items-center gap-2 flex-1">

            <div

              className={`h-1.5 flex-1 rounded-full transition-all ${

                i <= step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/8"

              }`}

            />

          </div>

        ))}

      </div>

      <p className="text-center text-xs text-white/40">

        {STEPS[step]} · Step {step + 1} of {STEPS.length}

      </p>



      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 min-h-[280px]">

        {step === 0 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">What&apos;s your gender?</p>

            <div className="grid grid-cols-2 gap-3">

              {GENDERS.map(({ id, label }) => (

                <button

                  key={id}

                  type="button"

                  onClick={() => setGender(id)}

                  className={`p-4 rounded-2xl border transition-all ${

                    gender === id

                      ? "bg-purple-500/15 border-purple-500/40 text-white"

                      : "bg-white/3 border-white/8 text-white/70 hover:border-white/20"

                  }`}

                >

                  {label}

                </button>

              ))}

            </div>

          </div>

        )}



        {step === 1 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">Age group</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

              {AGE_GROUPS.map(({ id, label }) => (

                <button

                  key={id}

                  type="button"

                  onClick={() => setAgeGroup(id)}

                  className={`p-4 rounded-2xl border transition-all ${

                    ageGroup === id

                      ? "bg-pink-500/15 border-pink-500/40 text-white"

                      : "bg-white/3 border-white/8 text-white/70 hover:border-white/20"

                  }`}

                >

                  {label}

                </button>

              ))}

            </div>

          </div>

        )}



        {step === 2 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">Pick at least one interest.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

              {INTERESTS.map(({ id, label, icon: Icon }) => {

                const active = interests.includes(id);

                return (

                  <button

                    key={id}

                    type="button"

                    onClick={() => toggleInterest(id)}

                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${

                      active

                        ? "bg-purple-500/15 border-purple-500/40 text-white"

                        : "bg-white/3 border-white/8 text-white/60 hover:text-white hover:border-white/20"

                    }`}

                  >

                    <Icon className={`w-6 h-6 ${active ? "text-purple-300" : "text-white/40"}`} />

                    <span className="text-sm font-medium">{label}</span>

                    {active && <Check className="w-4 h-4 text-purple-300" />}

                  </button>

                );

              })}

            </div>

          </div>

        )}



        {step === 3 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">What&apos;s your usual budget?</p>

            <div className="space-y-3">

              {BUDGETS.map(({ id, label, sub }) => (

                <button

                  key={id}

                  type="button"

                  onClick={() => setBudget(id)}

                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${

                    budget === id

                      ? "bg-purple-500/15 border-purple-500/40 text-white"

                      : "bg-white/3 border-white/8 text-white/70 hover:border-white/20"

                  }`}

                >

                  <div>

                    <p className="font-semibold">{label}</p>

                    <p className="text-xs text-white/40 mt-0.5">{sub}</p>

                  </div>

                  {budget === id && <Check className="w-5 h-5 text-purple-300" />}

                </button>

              ))}

            </div>

          </div>

        )}



        {step === 4 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">Which best describes your style?</p>

            <div className="grid grid-cols-2 gap-3">

              {STYLES.map(({ id, label }) => (

                <button

                  key={id}

                  type="button"

                  onClick={() => setStyle(id)}

                  className={`p-4 rounded-2xl border transition-all ${

                    style === id

                      ? "bg-pink-500/15 border-pink-500/40 text-white"

                      : "bg-white/3 border-white/8 text-white/70 hover:border-white/20"

                  }`}

                >

                  <span className="font-medium">{label}</span>

                </button>

              ))}

            </div>

          </div>

        )}



        {step === 5 && (

          <div className="space-y-4">

            <p className="font-semibold text-white">Where are you based?</p>

            <input

              value={city}

              onChange={(e) => setCity(e.target.value)}

              placeholder="e.g. Nairobi, Westlands"

              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"

            />

            <p className="text-xs text-white/40">

              Used for nearby vendors, weather tips, and ad targeting.

            </p>

          </div>

        )}

      </div>



      <div className="flex items-center justify-between">

        <button

          type="button"

          onClick={back}

          disabled={step === 0}

          className="text-sm text-white/40 hover:text-white disabled:opacity-30"

        >

          Back

        </button>

        {step < STEPS.length - 1 ? (

          <button

            type="button"

            onClick={next}

            disabled={!canAdvance}

            className="flex items-center gap-1.5 bg-white text-black px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-white/90"

          >

            Continue <ChevronRight className="w-4 h-4" />

          </button>

        ) : (

          <button

            type="button"

            onClick={finish}

            disabled={submitting}

            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"

          >

            {submitting ? "Saving…" : "Finish & explore"}

          </button>

        )}

      </div>

    </div>

  );

}

