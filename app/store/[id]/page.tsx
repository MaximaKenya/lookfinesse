import { getStore } from "@/lib/marketplace";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore(id);

  if (!store) {
    return <p className="text-center py-20">Store not found</p>;
  }

  return (
    <div>
      <Navbar />

      <div className="p-6">
        {/* Banner */}
        {store.banner_url && (
          <img
            src={store.banner_url}
            className="w-full h-48 object-cover rounded-xl"
          />
        )}

        <h1 className="text-2xl font-bold mt-4">{store.name}</h1>
        <p className="text-gray-600">{store.description}</p>

        {/* Products */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {store.products?.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}