"use client";

import WhatsAppShareButton from "@/components/commerce/WhatsAppShareButton";
import { productWhatsAppMessage, checkoutWhatsAppMessage } from "@/lib/whatsapp/share";

export function ProductWhatsAppShare({
  name,
  priceKes,
  productId,
  vendorName,
}: {
  name: string;
  priceKes: number;
  productId: string;
  vendorName?: string;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin || ""}/product/${productId}`;
  const text = productWhatsAppMessage({ name, priceKes, url: url || `/product/${productId}`, vendorName });
  return <WhatsAppShareButton text={text} label="WhatsApp" />;
}

export function CheckoutWhatsAppShare({ totalKes, orderId }: { totalKes: number; orderId?: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/checkout${orderId ? `?order=${orderId}` : ""}`;
  const text = checkoutWhatsAppMessage({ totalKes, url, orderId });
  return <WhatsAppShareButton text={text} label="Send checkout on WhatsApp" />;
}
