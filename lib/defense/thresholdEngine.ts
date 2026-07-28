export function dynamicThreshold(
  recentFraudCount: number
) {
  if (recentFraudCount > 20) {
    return {
      payoutFreezeThreshold:
        0.5,

      blockThreshold: 0.4,
    };
  }

  return {
    payoutFreezeThreshold:
      0.8,

    blockThreshold: 0.7,
  };
}