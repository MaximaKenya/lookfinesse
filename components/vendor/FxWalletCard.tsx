interface Props {
  currency: string;
  balance: number;
}

export default function FxWalletCard({
  currency,
  balance,
}: Props) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl">
      <p className="text-gray-400">
        FX Balance ({currency})
      </p>

      <h2 className="text-2xl font-bold mt-2">
        {balance.toLocaleString()}
      </h2>
    </div>
  );
}