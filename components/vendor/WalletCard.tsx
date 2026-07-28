interface Props {
  currency: string;
  balance: number;
}

export default function WalletCard({
  currency,
  balance,
}: Props) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl shadow-lg">
      <p className="text-gray-400 text-sm">
        {currency} Wallet
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {balance.toLocaleString()}
      </h2>
    </div>
  );
}