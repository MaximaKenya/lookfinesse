"use client";

type Props = {
  eventType: string;
  setEventType: (value: string) => void;

  direction: string;
  setDirection: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;
};

export default function TransactionFilters({
  eventType,
  setEventType,
  direction,
  setDirection,
  status,
  setStatus,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EVENT TYPE */}

        <select
          value={eventType}
          onChange={(e) =>
            setEventType(e.target.value)
          }
          className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 outline-none"
        >
          <option value="">
            All Events
          </option>

          <option value="PAYMENT_RECEIVED">
            PAYMENT_RECEIVED
          </option>

          <option value="ESCROW_HELD">
            ESCROW_HELD
          </option>

          <option value="ESCROW_RELEASED">
            ESCROW_RELEASED
          </option>

          <option value="PAYOUT_SENT">
            PAYOUT_SENT
          </option>

          <option value="REFUND_ISSUED">
            REFUND_ISSUED
          </option>

          <option value="FRAUD_FLAGGED">
            FRAUD_FLAGGED
          </option>
        </select>

        {/* DIRECTION */}

        <select
          value={direction}
          onChange={(e) =>
            setDirection(e.target.value)
          }
          className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 outline-none"
        >
          <option value="">
            All Directions
          </option>

          <option value="credit">
            Credit
          </option>

          <option value="debit">
            Debit
          </option>
        </select>

        {/* STATUS */}

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 outline-none"
        >
          <option value="">
            All Status
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="failed">
            Failed
          </option>

          <option value="reversed">
            Reversed
          </option>
        </select>
      </div>
    </div>
  );
}