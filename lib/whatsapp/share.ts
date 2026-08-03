/** Build WhatsApp share / deep-link URLs (wa.me). No Business API required. */

export function whatsappShareUrl(text: string, phoneE164?: string): string {
  const encoded = encodeURIComponent(text);
  if (phoneE164) {
    const digits = phoneE164.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function productWhatsAppMessage(opts: {
  name: string;
  priceKes: number;
  url: string;
  vendorName?: string;
}): string {
  const vendor = opts.vendorName ? ` from ${opts.vendorName}` : "";
  return `Check out *${opts.name}*${vendor} on LookFinesse — KES ${opts.priceKes.toLocaleString()}\n${opts.url}`;
}

export function checkoutWhatsAppMessage(opts: {
  orderId?: string;
  totalKes: number;
  url: string;
}): string {
  const order = opts.orderId ? `Order ${opts.orderId}` : "My cart";
  return `${order} on LookFinesse — total KES ${opts.totalKes.toLocaleString()}\nComplete checkout: ${opts.url}`;
}
