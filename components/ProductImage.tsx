"use client";

import { useState, useEffect } from "react";

export default function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState("/placeholder.png");

  useEffect(() => {
    if (src && (src.startsWith("http") || src.startsWith("/"))) {
      setImgSrc(src);
    } else {
      setImgSrc("/placeholder.png");
    }
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt || "Product image"}
      className={className}
      onError={() => setImgSrc("/placeholder.png")}
    />
  );
}