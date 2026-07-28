import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-400">
          Your order has been confirmed.
        </p>

        <Link
          href="/feed"
          className="inline-block mt-4 bg-white text-black px-6 py-3 rounded-xl"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}