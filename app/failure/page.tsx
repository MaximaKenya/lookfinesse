export default function FailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Payment Failed ❌
        </h1>
        <p className="text-gray-400">
          Please try again.
        </p>

        <a
          href="/checkout"
          className="inline-block mt-4 bg-white text-black px-6 py-3 rounded-xl"
        >
          Retry Payment
        </a>
      </div>
    </div>
  );
}