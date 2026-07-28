"use client";

import { useMemo, useState } from "react";
import ServiceCard from "@/components/services/ServiceCard";
import SearchInput from "@/components/ui/SearchInput";

type Service = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  vendors?: { name?: string };
};

export default function ServicesList({ services }: { services: Service[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return services;
    const q = query.toLowerCase();
    return services.filter(
      (s) =>
        (s.title ?? s.name ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.category ?? "").toLowerCase().includes(q) ||
        (s.vendors?.name ?? "").toLowerCase().includes(q)
    );
  }, [services, query]);

  return (
    <div className="space-y-5">
      <SearchInput onChange={setQuery} placeholder="Search services, salons, trainers…" />
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-white/60">No services match your search</div>
      )}
    </div>
  );
}
