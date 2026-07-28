interface Props {
  risk_score: number;
  trust_tier: string;
  is_frozen: boolean;
}

export default function RiskStatusCard({
  risk_score,
  trust_tier,
  is_frozen,
}: Props) {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        Account Health
      </h2>

      <p>
        Risk Score:
        <span className="ml-2 text-yellow-400">
          {risk_score}
        </span>
      </p>

      <p className="mt-2">
        Trust Tier:
        <span className="ml-2 text-green-400">
          {trust_tier}
        </span>
      </p>

      <p className="mt-2">
        Status:
        <span
          className={`ml-2 ${
            is_frozen
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {is_frozen ? "Frozen" : "Active"}
        </span>
      </p>
    </div>
  );
}