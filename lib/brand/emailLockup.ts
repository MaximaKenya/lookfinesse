/** Email-safe Open Arc lockup. Navy ink on white, when an absolute origin is known. */
export function emailLockupHtml(origin?: string | null) {
  const base = origin?.replace(/\/$/, "") ?? "";
  if (base) {
    return `<div style="margin:0 0 20px"><img src="${base}/brand/logo-email.png" alt="LookFinesse" width="148" height="148" style="display:block;border:0;height:148px;width:148px"/></div>`;
  }
  return `<p style="margin:0 0 20px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:18px;font-weight:650;letter-spacing:-0.04em;color:#1C1016">LookFinesse</p>`;
}

export function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "";
}
