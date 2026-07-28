export default function EscrowVisualizer() {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">
        Escrow Lifecycle
      </h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <p>PAYMENT_RECEIVED</p>
        </div>

        <div className="ml-2 h-10 border-l border-zinc-700" />

        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <p>ESCROW_HELD</p>
        </div>

        <div className="ml-2 h-10 border-l border-zinc-700" />

        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <p>ESCROW_RELEASED</p>
        </div>

        <div className="ml-2 h-10 border-l border-zinc-700" />

        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <p>PAYOUT_SENT</p>
        </div>
      </div>
    </div>
  );
}