"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock3, MapPin, Video, Star } from "lucide-react";

type Props = {
  service: {
    id: string;
    title: string;
    short_description?: string;
    cover_image?: string;
    price: number;
    duration_minutes?: number;
    is_virtual?: boolean;
    is_in_person?: boolean;
    vendors?: { name?: string; business_name?: string; avatar_url?: string };
    rating?: number;
  };
};

export default function ServiceCard({ service }: Props) {
  return (
    <article className="bg-[#0f0f0f] rounded-3xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group h-full flex flex-col">
      <div className="relative aspect-[4/3] bg-[#111] overflow-hidden">
        {service.cover_image ? (
          <Image
            src={service.cover_image}
            alt=""
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#111] to-pink-900/20 flex items-center justify-center">
            <span className="text-4xl opacity-30">✦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5">
          <span className="text-white font-bold text-sm">KES {service.price?.toLocaleString()}</span>
        </div>

        {/* Mode badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {service.is_virtual && (
            <span className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Video className="w-2.5 h-2.5" /> Virtual
            </span>
          )}
          {service.is_in_person && (
            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" /> In Person
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-bold text-white leading-snug">{service.title}</h3>
        {service.short_description && (
          <p className="text-[13px] text-white/50 mt-1.5 line-clamp-2 flex-1">{service.short_description}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-[12px] text-white/40">
          {service.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock3 className="w-3 h-3" />
              {service.duration_minutes} min
            </span>
          )}
          {service.rating && (
            <span className="flex items-center gap-1 text-yellow-400/70">
              <Star className="w-3 h-3 fill-current" />
              {service.rating.toFixed(1)}
            </span>
          )}
        </div>

        <Link
          href={`/services/${service.id}`}
          className="mt-4 block text-center bg-white text-black py-2.5 rounded-2xl font-semibold text-sm hover:bg-white/90 transition-all"
        >
          Book Now
        </Link>
      </div>
    </article>
  );
}
