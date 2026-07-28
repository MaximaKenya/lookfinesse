import Link from "next/link";
import { getServices } from "@/lib/social/queries";
import ServicesCategoryFilter from "@/components/services/ServicesCategoryFilter";
import ServicesList from "@/components/services/ServicesList";
import { Sparkles } from "lucide-react";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const services = await getServices(category && category !== "all" ? category : undefined);
  const activeCategory = category ?? "all";

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-purple-900/25 via-[#0f0f0f] to-pink-900/15 border border-white/8 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] pointer-events-none" />
        <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
        <h1 className="text-3xl font-bold text-white">Book Experiences</h1>
        <p className="text-white/40 mt-1">Salons, trainers, classes & wellness sessions in Nairobi</p>
      </div>

      <ServicesCategoryFilter activeCategory={activeCategory} />

      {services.length > 0 ? (
        <ServicesList services={services} />
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="text-5xl">📅</div>
          <p className="text-white/40 font-medium">No services in this category yet</p>
          <Link href="/services" className="inline-block bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm">
            View all services
          </Link>
        </div>
      )}
    </section>
  );
}
