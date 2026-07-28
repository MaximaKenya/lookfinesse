import { supabase } from "@/lib/supabaseClient";

export async function updateBehaviorProfile(
  vendorId: string,
  transaction: {
    amount: number;
    geo_location?: string;
    device_id?: string;
    created_at?: string;
  }
) {
  const { data: existing } = await supabase
    .from("vendor_behavior_profiles")
    .select("*")
    .eq("vendor_id", vendorId)
    .single();

  /**
   * NEW PROFILE
   */
  if (!existing) {
    await supabase
      .from("vendor_behavior_profiles")
      .insert({
        vendor_id: vendorId,

        avg_transaction_amount:
          transaction.amount,

        avg_daily_volume:
          transaction.amount,

        payout_velocity: 1,

        transaction_count: 1,

        normal_geo_locations:
          transaction.geo_location
            ? [transaction.geo_location]
            : [],

        known_devices:
          transaction.device_id
            ? [transaction.device_id]
            : [],

        normal_active_hours: [
          new Date(
            transaction.created_at ||
              new Date().toISOString()
          ).getHours(),
        ],

        last_activity_at:
          transaction.created_at ||
          new Date().toISOString(),
      });

    return;
  }

  /**
   * UPDATE EXISTING PROFILE
   */

  const transactionCount =
    (existing.transaction_count || 0) + 1;

  const newAverage =
    ((existing.avg_transaction_amount || 0) *
      (transactionCount - 1) +
      transaction.amount) /
    transactionCount;

  const geoLocations = new Set(
    existing.normal_geo_locations || []
  );

  if (transaction.geo_location) {
    geoLocations.add(transaction.geo_location);
  }

  const devices = new Set(
    existing.known_devices || []
  );

  if (transaction.device_id) {
    devices.add(transaction.device_id);
  }

  const activeHours = new Set(
    existing.normal_active_hours || []
  );

  activeHours.add(
    new Date(
      transaction.created_at ||
        new Date().toISOString()
    ).getHours()
  );

  await supabase
    .from("vendor_behavior_profiles")
    .update({
      avg_transaction_amount:
        newAverage,

      avg_daily_volume:
        (existing.avg_daily_volume || 0) +
        transaction.amount,

      payout_velocity:
        (existing.payout_velocity || 0) + 1,

      transaction_count:
        transactionCount,

      normal_geo_locations:
        Array.from(geoLocations),

      known_devices:
        Array.from(devices),

      normal_active_hours:
        Array.from(activeHours),

      last_activity_at:
        transaction.created_at ||
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq("vendor_id", vendorId);
}