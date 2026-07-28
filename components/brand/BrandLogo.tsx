import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "full" | "icon";
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  showWordmark?: boolean;
};

const SIZES = {
  sm: { icon: 28, full: { w: 156, h: 28 } },
  md: { icon: 32, full: { w: 180, h: 32 } },
  lg: { icon: 40, full: { w: 212, h: 38 } },
} as const;

const ASSETS = {
  full: { dark: "/logo.svg", light: "/logo-light.svg" },
  icon: { dark: "/logo-icon.svg", light: "/logo-icon.svg" },
} as const;

export default function BrandLogo({
  variant = "full",
  theme = "dark",
  size = "md",
  href,
  className = "",
  showWordmark,
}: BrandLogoProps) {
  const dims = SIZES[size];
  const useIcon = variant === "icon" || showWordmark === false;
  const assetKey = useIcon ? "icon" : "full";
  const src = ASSETS[assetKey][theme];
  const width = useIcon ? dims.icon : dims.full.w;
  const height = useIcon ? dims.icon : dims.full.h;

  const logo = (
    <Image
      src={src}
      alt="LookFinesse"
      width={width}
      height={height}
      className={href ? undefined : className}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
        {logo}
      </Link>
    );
  }

  return logo;
}
