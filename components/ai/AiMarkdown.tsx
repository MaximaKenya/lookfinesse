"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Lightweight markdown: **bold**, [label](/path), newlines, bullets. */
export default function AiMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l) || l.trim() === "");
        if (isList) {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{renderInline(l.replace(/^\s*[-*•]\s+/, ""))}</li>
                ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(line.replace(/^#{1,3}\s+/, ""))}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-inherit">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const label = match[2];
      const href = match[3];
      const internal = href.startsWith("/");
      parts.push(
        internal ? (
          <Link
            key={key++}
            href={href}
            className="underline underline-offset-2 decoration-white/30 hover:decoration-white font-medium"
          >
            {label}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-white/30 hover:decoration-white font-medium"
          >
            {label}
          </a>
        )
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
