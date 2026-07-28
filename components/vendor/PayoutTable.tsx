interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Props {
  payouts: Payout[];
}

export default function PayoutTable({
  payouts,
}: Props) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        Recent Payouts
      </h2>

      <div className="space-y-3">
        {payouts.map((p) => (
          <div
            key={p.id}
            className="flex justify-between border-b border-gray-800 pb-2"
          >
            <div>
              <p>{p.amount}</p>

              <p className="text-sm text-gray-500">
                {new Date(
                  p.created_at
                ).toLocaleDateString()}
              </p>
            </div>

            <div>
              <span className="text-yellow-400">
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}