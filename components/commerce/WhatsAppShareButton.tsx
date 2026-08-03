"use client";

import { MessageCircle } from "lucide-react";
import { whatsappShareUrl } from "@/lib/whatsapp/share";

type Props = {
  text: string;
  phone?: string;
  className?: string;
  label?: string;
};

export default function WhatsAppShareButton({
  text,
  phone,
  className = "",
  label = "Share on WhatsApp",
}: Props) {
  const href = whatsappShareUrl(text, phone);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors"
      }
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
