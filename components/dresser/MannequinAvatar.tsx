"use client";

import type { DresserPrefs } from "@/lib/dresser/types";
import { buildMannequinParams } from "@/lib/dresser/types";
import {
  getZoneLayer,
  ZONE_LAYERS,
  ZONE_CLIP_IDS,
  type DresserZone,
} from "@/lib/dresser/zones";
import {
  checkTryOnCompat,
  classifyTryOn,
  inferTryOnZone,
  type TryOnKind,
} from "@/lib/dresser/tryOn";

export type GarmentLayer = {
  url: string;
  name?: string;
  zone?: DresserZone;
  category?: string;
  kind?: TryOnKind;
};

type Props = {
  prefs: DresserPrefs;
  garmentUrl?: string | null;
  garmentName?: string;
  garmentCategory?: string;
  layers?: GarmentLayer[];
  className?: string;
};

function zoneCenter(zone: DresserZone) {
  const layer = getZoneLayer(zone);
  return {
    cx: layer.x + layer.width / 2,
    cy: layer.y + layer.height / 2,
  };
}

export default function MannequinAvatar({
  prefs,
  garmentUrl,
  garmentName,
  garmentCategory,
  layers = [],
  className = "",
}: Props) {
  const { skin, widthScale, heightScale } = buildMannequinParams(prefs);
  const isMale = prefs.gender === "male";
  const isFemale = prefs.gender === "female";
  const hair = isMale ? "#1a1208" : isFemale ? "#2a1a12" : "#241812";
  const lip = isFemale ? "#c46d7a" : "#b07a6d";
  const shoulder = 46 * widthScale;
  const torsoTop = 58;
  const torsoH = 68 * heightScale;
  const legH = 58 * heightScale;

  const compat = garmentUrl
    ? checkTryOnCompat(prefs, garmentCategory, garmentName)
    : null;

  const allLayers: GarmentLayer[] = [
    ...layers,
    ...(garmentUrl && compat?.ok
      ? [
          {
            url: garmentUrl,
            name: garmentName,
            zone: compat.zone,
            category: garmentCategory,
            kind: compat.kind,
          },
        ]
      : []),
  ];

  const sortedGarments = [...allLayers].sort((a, b) => {
    const za = getZoneLayer(a.zone ?? inferTryOnZone(a.category, a.name)).zIndex;
    const zb = getZoneLayer(b.zone ?? inferTryOnZone(b.category, b.name)).zIndex;
    return za - zb;
  });

  return (
    <div className={`relative flex flex-col items-center justify-end ${className}`}>
      {compat && !compat.ok && (
        <p className="mb-3 max-w-[240px] text-center text-[11px] leading-relaxed text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {compat.message}
        </p>
      )}

      <svg
        viewBox="0 0 120 200"
        className="w-full max-w-[240px] h-auto drop-shadow-2xl"
        role="img"
        aria-label={garmentName ? `Avatar wearing ${garmentName}` : "Virtual dresser avatar"}
      >
        <defs>
          <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1020" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <radialGradient id="spot" cx="50%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="skinShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={skin} stopOpacity="1" />
            <stop offset="100%" stopColor={skin} stopOpacity="0.82" />
          </linearGradient>
          <filter id="soft">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.35" />
          </filter>
          <clipPath id="clip-torso">
            <path d={`M${60 - shoulder / 2} ${torsoTop} Q60 ${torsoTop - 6} ${60 + shoulder / 2} ${torsoTop} L${60 + shoulder / 2 - 4} ${torsoTop + torsoH} Q60 ${torsoTop + torsoH + 8} ${60 - shoulder / 2 + 4} ${torsoTop + torsoH} Z`} />
          </clipPath>
          <clipPath id="clip-legs">
            <path d={`M${52} ${torsoTop + torsoH} L${48} ${torsoTop + torsoH + legH} Q50 ${torsoTop + torsoH + legH + 4} ${56} ${torsoTop + torsoH + legH + 2} L${58} ${torsoTop + torsoH} Z M${68} ${torsoTop + torsoH} L${72} ${torsoTop + torsoH + legH} Q70 ${torsoTop + torsoH + legH + 4} ${64} ${torsoTop + torsoH + legH + 2} L${62} ${torsoTop + torsoH} Z`} />
          </clipPath>
          <clipPath id="clip-head">
            <ellipse cx="60" cy="34" rx="17" ry="19" />
          </clipPath>
          <clipPath id="clip-face">
            <ellipse cx="60" cy="34" rx="13" ry="15" />
          </clipPath>
          <clipPath id="clip-feet">
            <ellipse cx="52" cy="176" rx="8" ry="4" />
            <ellipse cx="68" cy="176" rx="8" ry="4" />
          </clipPath>
          <clipPath id="clip-neck">
            <rect x="52" y="46" width="16" height="14" rx="6" />
          </clipPath>
          <clipPath id="clip-hand">
            <ellipse cx="22" cy="88" rx="11" ry="14" />
          </clipPath>
          <clipPath id="clip-back">
            <rect x="18" y="52" width="84" height="90" rx="18" />
          </clipPath>
        </defs>

        <rect width="120" height="200" fill="url(#stage)" rx="16" />
        <ellipse cx="60" cy="185" rx="42" ry="8" fill="#000" opacity="0.35" />
        <ellipse cx="60" cy="42" rx="55" ry="45" fill="url(#spot)" />

        <g filter="url(#soft)">
          <rect x="52" y="46" width="16" height="14" rx="6" fill="url(#skinShade)" />
          <ellipse cx="60" cy="34" rx="17" ry="19" fill="url(#skinShade)" />
          <path
            d={
              isMale
                ? "M43 34 C43 18 52 12 60 12 C68 12 77 18 77 34 C77 28 72 24 60 24 C48 24 43 28 43 34 Z"
                : "M42 36 C42 14 50 8 60 8 C70 8 78 14 78 36 C78 30 74 22 60 20 C46 22 42 30 42 36 C40 42 41 48 44 52 C46 44 52 40 60 40 C68 40 74 44 76 52 C79 48 80 42 78 36 Z"
            }
            fill={hair}
            opacity="0.95"
          />
          <ellipse cx="53" cy="33" rx="2.2" ry="1.6" fill="#2a1810" opacity="0.85" />
          <ellipse cx="67" cy="33" rx="2.2" ry="1.6" fill="#2a1810" opacity="0.85" />
          <path d="M58 37 Q60 39 62 37" stroke="#9a6555" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M57 41 Q60 43 63 41" stroke={lip} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {isMale && (
            <path d="M54 44 Q60 47 66 44 Q64 49 60 49 Q56 49 54 44 Z" fill="#1a1208" opacity="0.35" />
          )}
          <path
            d={`M${60 - shoulder / 2} ${torsoTop} Q60 ${torsoTop - 6} ${60 + shoulder / 2} ${torsoTop} L${60 + shoulder / 2 - 4} ${torsoTop + torsoH} Q60 ${torsoTop + torsoH + 8} ${60 - shoulder / 2 + 4} ${torsoTop + torsoH} Z`}
            fill="url(#skinShade)"
          />
          <path
            d={`M${60 - shoulder / 2} ${torsoTop + 8} Q${34 - widthScale * 4} ${torsoTop + 24} ${30} ${torsoTop + 48} Q${34} ${torsoTop + 52} ${38} ${torsoTop + 44} Q${42} ${torsoTop + 28} ${60 - shoulder / 2 + 2} ${torsoTop + 18} Z`}
            fill="url(#skinShade)"
          />
          <path
            d={`M${60 + shoulder / 2} ${torsoTop + 8} Q${86 + widthScale * 4} ${torsoTop + 24} ${90} ${torsoTop + 48} Q${86} ${torsoTop + 52} ${82} ${torsoTop + 44} Q${78} ${torsoTop + 28} ${60 + shoulder / 2 - 2} ${torsoTop + 18} Z`}
            fill="url(#skinShade)"
          />
          <path
            d={`M${52} ${torsoTop + torsoH} L${48} ${torsoTop + torsoH + legH} Q50 ${torsoTop + torsoH + legH + 4} ${56} ${torsoTop + torsoH + legH + 2} L${58} ${torsoTop + torsoH} Z`}
            fill="url(#skinShade)"
          />
          <path
            d={`M${68} ${torsoTop + torsoH} L${72} ${torsoTop + torsoH + legH} Q70 ${torsoTop + torsoH + legH + 4} ${64} ${torsoTop + torsoH + legH + 2} L${62} ${torsoTop + torsoH} Z`}
            fill="url(#skinShade)"
          />
          <ellipse cx="52" cy="176" rx="8" ry="4" fill={skin} opacity="0.9" />
          <ellipse cx="68" cy="176" rx="8" ry="4" fill={skin} opacity="0.9" />
        </g>

        {sortedGarments.length === 0 &&
          ZONE_LAYERS.map((z) => (
            <rect
              key={z.zone}
              x={z.x}
              y={z.y}
              width={z.width}
              height={z.height}
              fill="none"
              stroke="#ffffff08"
              strokeDasharray="2 2"
              rx="4"
            />
          ))}

        {sortedGarments.map((g, i) => {
          const zone = g.zone ?? inferTryOnZone(g.category, g.name);
          const kind = g.kind ?? classifyTryOn(g.category, g.name);
          const layer = getZoneLayer(zone);
          const clipId = ZONE_CLIP_IDS[zone];

          if (kind === "cosmetic") {
            const { cx, cy } = zoneCenter(zone);
            return (
              <g key={`${g.url}-${i}`}>
                {/* Zone glow */}
                <circle cx={cx} cy={cy} r="14" fill="#fbbf24" opacity="0.18" />
                <circle cx={cx} cy={cy} r="9" fill="#fde68a" opacity="0.22" />
                {/* Small bottle icon (cap + body) instead of the product photo */}
                <rect x={cx - 1.6} y={cy - 6} width="3.2" height="2.4" rx="0.6" fill="#f5f5f4" opacity="0.9" />
                <rect x={cx - 2.8} y={cy - 3.8} width="5.6" height="8.4" rx="1.6" fill="#fde68a" opacity="0.95" />
                <rect x={cx - 2.8} y={cy - 0.6} width="5.6" height="2" fill="#ffffff" opacity="0.5" />
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#ffffffaa" fontSize="6">
                  Applied
                </text>
              </g>
            );
          }

          return (
            <g key={`${g.url}-${i}`} clipPath={`url(#${clipId})`}>
              <image
                href={g.url}
                x={layer.x - (kind === "apparel" ? 4 : 0)}
                y={layer.y - (kind === "apparel" ? 2 : 0)}
                width={layer.width + (kind === "apparel" ? 8 : 0)}
                height={layer.height + (kind === "apparel" ? 4 : 0)}
                preserveAspectRatio={kind === "accessory" ? "xMidYMid meet" : "xMidYMid slice"}
                opacity="0.9"
              />
            </g>
          );
        })}

        {!sortedGarments.length && (
          <text x="60" y="110" textAnchor="middle" fill="#ffffff55" fontSize="9">
            Select item to try on
          </text>
        )}
      </svg>
    </div>
  );
}
