"use client";

import { CheckCircle2, Clock3, Package, Truck, Wallet } from "lucide-react";

type TimelineEvent = {
  title: string;
  description: string;
  time: string;
  completed: boolean;
  icon: React.ReactNode;
};

export default function TransactionTimeline({ orderId }: { orderId: string }) {
  /**
   * Later:
   * Replace with realtime DB/API fetch
   */

  const events: TimelineEvent[] = [
    {
      title: "Payment Received",
      description: "Buyer payment successfully captured.",
      time: "09:14 AM",
      completed: true,
      icon: <Wallet size={18} />,
    },

    {
      title: "Escrow Secured",
      description: "Funds secured inside treasury escrow layer.",
      time: "09:15 AM",
      completed: true,
      icon: <CheckCircle2 size={18} />,
    },

    {
      title: "Vendor Accepted",
      description: "Vendor accepted fulfillment request.",
      time: "09:21 AM",
      completed: true,
      icon: <Package size={18} />,
    },

    {
      title: "Shipment In Transit",
      description: "Courier currently handling package.",
      time: "11:42 AM",
      completed: true,
      icon: <Truck size={18} />,
    },

    {
      title: "Payout Release Pending",
      description: "Awaiting delivery confirmation.",
      time: "Pending",
      completed: false,
      icon: <Clock3 size={18} />,
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Transaction Timeline
            </h2>

            <p className="text-zinc-400 mt-2">
              Real-time operational and escrow lifecycle tracking
            </p>
          </div>

          <div className="text-sm text-zinc-500">
            ORDER #{(orderId || "UNKNOWN").toString().slice(0, 8)}
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* ICON */}
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  event.completed
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500"
                }`}
              >
                {event.icon}
              </div>

              {index !== events.length - 1 && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-10 bg-zinc-800" />
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 pb-6">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2">
                <div>
                  <div
                    className={`font-semibold ${
                      event.completed ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {event.title}
                  </div>

                  <div className="text-sm text-zinc-400 mt-1">
                    {event.description}
                  </div>
                </div>

                <div
                  className={`text-sm ${
                    event.completed ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {event.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
