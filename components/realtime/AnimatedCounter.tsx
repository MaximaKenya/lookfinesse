"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  prefix?: string;
}

export default function AnimatedCounter({
  value,
  prefix = "",
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;

    const increment = value / 50;

    const timer = setInterval(() => {
      current += increment;

      if (current >= value) {
        current = value;
        clearInterval(timer);
      }

      setCount(Math.floor(current));
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
    </span>
  );
}