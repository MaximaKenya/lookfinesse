"use client";

import { useId } from "react";
import {
  GOLD_X1,
  GOLD_X2,
  GOLD_Y1,
  GOLD_Y2,
  LOCKUP_VIEWBOX,
  MARK_SHIFT,
  MARK_VIEWBOX,
  OPEN_ARC_GOLD,
  OPEN_ARC_NAVY,
  OPEN_ARC_PATHS,
  OPEN_ARC_STROKE,
  WORDMARK_PATHS,
  WORDMARK_TRANSFORM,
  type OpenArcGroup,
} from "@/components/brand/openArcPaths";

const GROUPS: OpenArcGroup[] = ["woman", "gentleman", "back", "arc"];

export type AnimatedLogoProps = {
  /** Gold on a transparent ground, or deep-navy ink for light backgrounds. */
  theme?: "dark" | "light";
  /** Replay the draw forever. The default plays once. */
  loop?: boolean;
  /** The mark alone, cropped to the illustration. */
  showWordmark?: boolean;
  className?: string;
};

/**
 * Open Arc draws itself: the woman, then the gentleman, then the shared
 * back, then the arc from her lower back up and over to the tip of his
 * fedora brim. A gold glint follows the arc and the wordmark fades up.
 * About three seconds. prefers-reduced-motion shows the finished lockup.
 */
export default function AnimatedLogo({
  theme = "dark",
  loop = false,
  showWordmark = true,
  className = "",
}: AnimatedLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `oa-gold-${uid}`;
  const maskId = `oa-sweep-${uid}`;
  const ink = theme === "light";
  const stroke = ink ? OPEN_ARC_NAVY : `url(#${gradId})`;
  const wordFill = ink ? OPEN_ARC_NAVY : `url(#${gradId})`;

  return (
    <svg
      className={`oa-logo${loop ? " oa-loop" : ""}${className ? ` ${className}` : ""}`}
      viewBox={showWordmark ? LOCKUP_VIEWBOX : MARK_VIEWBOX}
      role="img"
      aria-label="LookFinesse"
      fill="none"
    >
      <style>{motionCss}</style>
      <defs>
        <linearGradient
          id={gradId}
          x1={GOLD_X1}
          y1={GOLD_Y1}
          x2={GOLD_X2}
          y2={GOLD_Y2}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={OPEN_ARC_GOLD[0]} />
          <stop offset="100%" stopColor={OPEN_ARC_GOLD[1]} />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect className="oa-bar" x="-220" y="-80" width="150" height="1200" fill="#fff" />
        </mask>
      </defs>

      <g
        transform={MARK_SHIFT}
        fill="none"
        stroke={stroke}
        strokeWidth={OPEN_ARC_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GROUPS.map((group) => (
          <g key={group}>
            {OPEN_ARC_PATHS.filter((path) => path.group === group).map((path) => (
              <path
                key={path.d}
                className={`oa-stroke oa-${group}`}
                pathLength={1}
                d={path.d}
              />
            ))}
          </g>
        ))}
      </g>

      <g
        transform={MARK_SHIFT}
        mask={`url(#${maskId})`}
        fill="none"
        stroke="#FFF6DE"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="oa-shine"
      >
        {OPEN_ARC_PATHS.map((path) => (
          <path key={`shine-${path.d}`} d={path.d} />
        ))}
      </g>

      {OPEN_ARC_PATHS.filter((path) => path.group === "arc").map((path) => (
        <g key="glint" transform={MARK_SHIFT}>
          <path
            className="oa-glint"
            d={path.d}
            pathLength={1}
            fill="none"
            stroke="#FFF8E7"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {showWordmark && (
        <g className="oa-word">
          <g transform={WORDMARK_TRANSFORM} fill={wordFill}>
            {WORDMARK_PATHS.map((d) => (
              <path key={d.slice(0, 24)} d={d} />
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}

const motionCss = `
.oa-logo .oa-stroke {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation-duration: 3s;
  animation-timing-function: linear;
  animation-fill-mode: both;
  animation-iteration-count: 1;
}
.oa-logo .oa-woman { animation-name: oa-draw-woman; }
.oa-logo .oa-gentleman { animation-name: oa-draw-gentleman; }
.oa-logo .oa-back { animation-name: oa-draw-back; }
.oa-logo .oa-arc { animation-name: oa-draw-arc; }
.oa-logo .oa-glint {
  stroke-dasharray: 0.07 0.93;
  stroke-dashoffset: 1;
  opacity: 0;
  animation: oa-glint 3s linear both 1;
}
.oa-logo .oa-bar {
  opacity: 0;
  animation: oa-sweep 3s linear both 1;
}
.oa-logo .oa-word {
  opacity: 1;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: oa-word 3s linear both 1;
}
.oa-logo.oa-loop .oa-stroke,
.oa-logo.oa-loop .oa-glint,
.oa-logo.oa-loop .oa-bar,
.oa-logo.oa-loop .oa-word {
  animation-iteration-count: infinite;
}
@keyframes oa-draw-woman {
  0% { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(.4, 0, .2, 1); }
  25% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
@keyframes oa-draw-gentleman {
  0%, 20% { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(.4, 0, .2, 1); }
  45% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
@keyframes oa-draw-back {
  0%, 41% { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(.4, 0, .2, 1); }
  55% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
@keyframes oa-draw-arc {
  0%, 51% { stroke-dashoffset: 1; animation-timing-function: cubic-bezier(.45, 0, .15, 1); }
  75% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
}
@keyframes oa-glint {
  0%, 73% { opacity: 0; stroke-dashoffset: 1; }
  78% { opacity: 0.95; }
  90% { opacity: 0; stroke-dashoffset: -0.08; }
  100% { opacity: 0; stroke-dashoffset: -0.08; }
}
@keyframes oa-sweep {
  0%, 71% { opacity: 0; transform: translateX(0); }
  76% { opacity: 0.85; }
  88% { opacity: 0; transform: translateX(1080px); }
  100% { opacity: 0; transform: translateX(1080px); }
}
@keyframes oa-word {
  0%, 78% { opacity: 0; transform: translateY(18%); }
  98%, 100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .oa-logo .oa-stroke {
    animation: none !important;
    stroke-dashoffset: 0 !important;
  }
  .oa-logo .oa-glint,
  .oa-logo .oa-bar,
  .oa-logo .oa-shine {
    animation: none !important;
    opacity: 0 !important;
  }
  .oa-logo .oa-word {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`;
