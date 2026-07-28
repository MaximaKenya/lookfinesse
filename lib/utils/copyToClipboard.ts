export type CopyResult =
  | { ok: true; method: "clipboard" | "execCommand" }
  | { ok: false; reason: string; text: string };

/**
 * Copy text safely — works on HTTP/LAN and mobile browsers without crashing.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  const value = String(text ?? "").trim();
  if (!value) {
    return { ok: false, reason: "Nothing to copy", text: value };
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return { ok: true, method: "clipboard" };
    } catch {
      // fall through to execCommand
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) return { ok: true, method: "execCommand" };
    } catch {
      // fall through
    }
  }

  return {
    ok: false,
    reason: "Copy not supported in this browser context",
    text: value,
  };
}
