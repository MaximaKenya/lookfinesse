export default function FraudCenter() {
  const alerts = [
    {
      id: 1,
      title: "Velocity Spike",
      severity: "High",
    },

    {
      id: 2,
      title: "Multiple Failed Payments",
      severity: "Medium",
    },
  ];

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">
        Fraud Monitoring
      </h2>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {alert.title}
              </p>

              <span className="text-red-400 text-sm">
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}