import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] px-4 text-center text-white">
      <p className="text-lg font-semibold">Product not found</p>
      <p className="mt-2 text-sm text-white/45">
        It may be sold out, removed, or the link is outdated.
      </p>
      <Link
        href="/shop"
        className="mt-6 rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-black"
      >
        Browse shop
      </Link>
    </div>
  );
}
