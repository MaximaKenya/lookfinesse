"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function LiveAlertBanner() {
  return (
    <motion.div
      animate={{
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      className="bg-red-950/40 border border-red-700 rounded-3xl p-5 flex items-center gap-4"
    >
      <AlertTriangle className="text-red-400" />

      <section>
        <p className="font-semibold">Elevated payout risk detected</p>
        <p className="text-sm text-gray-400">Automated liquidity protection enabled</p>
      </section>
    </motion.div>
  );
}
