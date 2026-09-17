import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white">
      <p className="text-lg font-semibold">Store not found</p>
      <p className="mt-2 text-sm text-white/45">
        This storefront may have moved or is no longer available.
      </p>
      <Link
        href="/shop"
        className="mt-6 rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-black"
      >
        Back to shop
      </Link>
    </div>
  );
}
