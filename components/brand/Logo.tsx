import Link from "next/link";
import { useId } from "react";
import {
  FULL_HEIGHT,
  FULL_VIEWBOX,
  FULL_WIDTH,
  MARK_PATH,
  MARK_SHIFT_X,
  MARK_VIEWBOX,
  SHEEN_PATH,
  WORD_PATH,
  WORD_X,
  WORD_Y,
} from "@/components/brand/geometry";

export type LogoVariant = "mark" | "full" | "icon";
export type LogoTheme = "dark" | "light" | "mono";
export type LogoSize = "sm" | "md" | "lg" | number;

type LogoProps = {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  href?: string;
  className?: string;
  /** @deprecated Use variant="mark". Kept so older call sites keep working. */
  showWordmark?: boolean;
};

const HEIGHTS = { sm: 28, md: 32, lg: 40 } as const;

const PALETTE: Record<
  LogoTheme,
  { word: string; stops: readonly [string, string, string]; sheen: number }
> = {
  dark: {
    word: "#FFF6F0",
    stops: ["#FDA4AF", "#C084FC", "#F5D0A8"],
    sheen: 0.5,
  },
  light: {
    word: "#1C1016",
    stops: ["#9F1239", "#6D28D9", "#9A3412"],
    sheen: 0.42,
  },
  mono: {
    word: "currentColor",
    stops: ["currentColor", "currentColor", "currentColor"],
    sheen: 0,
  },
};

function resolveHeight(size: LogoSize) {
  if (typeof size === "number") return size;
  return HEIGHTS[size];
}

export default function Logo({
  variant = "full",
  theme = "dark",
  size = "md",
  href,
  className = "",
  showWordmark,
}: LogoProps) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `lf-${rawId}`;
  const markOnly = variant === "mark" || variant === "icon" || showWordmark === false;
  const height = resolveHeight(size);
  const width = markOnly ? height : Math.round((height * FULL_WIDTH) / FULL_HEIGHT);
  const palette = PALETTE[theme];

  const graphic = (
    <svg
      className="lf-logo block h-auto max-w-full"
      width={width}
      height={height}
      viewBox={markOnly ? MARK_VIEWBOX : FULL_VIEWBOX}
      fill="none"
      role={href ? undefined : "img"}
      aria-label={href ? undefined : "LookFinesse"}
      aria-hidden={href ? true : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.stops[0]} />
          <stop offset="46%" stopColor={palette.stops[1]} />
          <stop offset="100%" stopColor={palette.stops[2]} />
        </linearGradient>
      </defs>
      <g className="lf-gem" transform={markOnly ? undefined : `translate(${MARK_SHIFT_X} 0)`}>
        <path d={MARK_PATH} fill={`url(#${gradId})`} />
        {palette.sheen > 0 && (
          <path
            d={SHEEN_PATH}
            fill="none"
            stroke="#FFF6F0"
            strokeOpacity={palette.sheen}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
      {!markOnly && (
        <path transform={`translate(${WORD_X} ${WORD_Y})`} d={WORD_PATH} fill={palette.word} />
      )}
    </svg>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="LookFinesse"
        className={`inline-flex items-center shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#C084FC] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      >
        {graphic}
      </Link>
    );
  }

  return <span className={`inline-flex items-center shrink-0 ${className}`}>{graphic}</span>;
}
