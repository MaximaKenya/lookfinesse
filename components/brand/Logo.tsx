import Link from "next/link";
import { useId } from "react";
import {
  GOLD_X1,
  GOLD_X2,
  GOLD_Y1,
  GOLD_Y2,
  ICON_STROKE,
  ICON_VIEWBOX,
  LOCKUP_VIEWBOX,
  MARK_SHIFT,
  MARK_VIEWBOX,
  OPEN_ARC_GOLD,
  OPEN_ARC_NAVY,
  OPEN_ARC_PATHS,
  OPEN_ARC_STROKE,
  WORDMARK_PATHS,
  WORDMARK_TRANSFORM,
} from "@/components/brand/openArcPaths";

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

function resolveHeight(size: LogoSize) {
  if (typeof size === "number") return size;
  return HEIGHTS[size];
}

/**
 * Static Open Arc lockup. `dark` is gold on a transparent ground for navy
 * and black surfaces. `light` is deep-navy ink for light surfaces. `icon`
 * uses the heavier stroke so the mark still reads in the nav.
 */
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
  const icon = variant === "icon";
  const height = resolveHeight(size);
  const viewBox = icon ? ICON_VIEWBOX : markOnly ? MARK_VIEWBOX : LOCKUP_VIEWBOX;
  const stroke = icon ? ICON_STROKE : OPEN_ARC_STROKE;
  const ink =
    theme === "mono" ? "currentColor" : theme === "light" ? OPEN_ARC_NAVY : `url(#${gradId})`;

  const graphic = (
    <svg
      className="lf-logo block h-auto max-w-full"
      width={height}
      height={height}
      viewBox={viewBox}
      fill="none"
      role={href ? undefined : "img"}
      aria-label={href ? undefined : "LookFinesse"}
      aria-hidden={href ? true : undefined}
    >
      {theme === "dark" && (
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
        </defs>
      )}
      <g
        transform={MARK_SHIFT}
        fill="none"
        stroke={ink}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {OPEN_ARC_PATHS.map((path) => (
          <path key={path.d} d={path.d} />
        ))}
      </g>
      {!markOnly && (
        <g transform={WORDMARK_TRANSFORM} fill={ink}>
          {WORDMARK_PATHS.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>
      )}
    </svg>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="LookFinesse"
        className={`inline-flex items-center shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#E8C37A] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      >
        {graphic}
      </Link>
    );
  }

  return <span className={`inline-flex items-center shrink-0 ${className}`}>{graphic}</span>;
}
