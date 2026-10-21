"use client";

import { useState } from "react";
import AnimatedLogo from "@/components/brand/AnimatedLogo";

const FILES = [
  { src: "/brand/open-arc/mark.svg", label: "mark.svg", note: "Illustration only" },
  { src: "/brand/open-arc/logo-dark.svg", label: "logo-dark.svg", note: "On navy" },
  { src: "/brand/open-arc/logo-light.svg", label: "logo-light.svg", note: "Ink on light" },
  { src: "/brand/open-arc/wordmark.svg", label: "wordmark.svg", note: "Bodoni Moda" },
] as const;

export default function OpenArcPreview() {
  const [play, setPlay] = useState(0);
  const [loop, setLoop] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f6f1e7]">
      <style>{`
        button[aria-label="Open AI Copilot"],
        button[aria-label="Expand AI Copilot"] { display: none !important; }
      `}</style>

      <header className="mx-auto max-w-6xl px-6 pt-10 pb-6">
        <p className="text-[11px] tracking-[0.28em] uppercase text-[#E8C37A]">
          LookFinesse · Phase 1 preview
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#f6f1e7]">Open Arc</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c9c0b0]">
              The approved mark, drawn once in about three seconds. The live logo,
              favicons, and navigation are unchanged until this preview is approved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-replay
              onClick={() => setPlay((n) => n + 1)}
              className="rounded-full border border-[#E8C37A]/50 px-4 py-2 text-sm text-[#E8C37A] hover:bg-[#E8C37A]/10"
            >
              Replay
            </button>
            <label className="flex items-center gap-2 text-sm text-[#c9c0b0]">
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => {
                  setLoop(event.target.checked);
                  setPlay((n) => n + 1);
                }}
              />
              Loop
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
        <section data-stage="navy" className="rounded-3xl bg-[#050A1A] px-6 py-10 shadow-inner">
          <p className="mb-6 text-center text-[11px] tracking-[0.22em] uppercase text-[#E8C37A]/80">
            Navy
          </p>
          <AnimatedLogo key={`navy-${play}-${loop ? "loop" : "once"}`} loop={loop} className="mx-auto w-full max-w-[520px]" />
        </section>
        <section data-stage="light" className="rounded-3xl bg-[#f7f3ec] px-6 py-10">
          <p className="mb-6 text-center text-[11px] tracking-[0.22em] uppercase text-[#050A1A]/60">
            Light
          </p>
          <AnimatedLogo
            key={`light-${play}-${loop ? "loop" : "once"}`}
            theme="light"
            loop={loop}
            className="mx-auto w-full max-w-[520px]"
          />
        </section>
      </div>

      <section data-shot="static" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-serif text-2xl">Static files</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FILES.map((file) => {
            const light = file.src.includes("light") || file.src.includes("wordmark");
            return (
              <figure
                key={file.src}
                data-shot={file.label}
                className={`overflow-hidden rounded-2xl border border-white/10 ${light ? "bg-[#f7f3ec]" : "bg-[#050A1A]"}`}
              >
                <div className="flex min-h-56 items-center justify-center p-8">
                  {/* SVG lockups stay as files so the stroke art is not re-encoded. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.src} alt={file.label} className="max-h-64 w-full object-contain" />
                </div>
                <figcaption className={`px-4 py-3 text-xs tracking-wide ${light ? "text-[#050A1A]/70" : "text-[#E8C37A]/80"}`}>
                  <span className="font-medium">{file.label}</span>
                  <span className="mx-2 opacity-40">·</span>
                  {file.note}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section data-shot="icons" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="font-serif text-2xl">Icon</h2>
        <p className="mt-2 text-sm text-[#c9c0b0]">Same mark, heavier stroke, at 512, 128, and 32 pixels.</p>
        <div className="mt-6 flex flex-wrap items-end gap-8 rounded-3xl bg-[#050A1A] px-8 py-10">
          {[512, 128, 32].map((size) => (
            <figure key={size} data-shot={`icon-${size}`} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/open-arc/icon.svg"
                alt={`Open Arc icon at ${size} pixels`}
                width={size}
                height={size}
                style={{ width: size, height: size }}
              />
              <figcaption className="mt-3 text-[11px] tracking-[0.18em] uppercase text-[#E8C37A]/70">
                {size}px
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-2">
        <figure className="overflow-hidden rounded-2xl bg-[#050A1A]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/open-arc/reference.jpg" alt="Approved Open Arc reference" className="w-full" />
          <figcaption className="px-4 py-3 text-xs text-[#E8C37A]/80">Approved reference</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-2xl bg-[#050A1A]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/open-arc/logo-dark.svg" alt="Vector Open Arc lockup" className="w-full" />
          <figcaption className="px-4 py-3 text-xs text-[#E8C37A]/80">Vector lockup</figcaption>
        </figure>
      </section>
    </div>
  );
}
