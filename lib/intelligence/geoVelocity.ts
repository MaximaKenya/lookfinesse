export function detectGeoVelocity(
  previousLocation: string,
  newLocation: string,
  previousTime: string,
  newTime: string
) {
  const previous =
    new Date(previousTime).getTime();

  const current =
    new Date(newTime).getTime();

  const minutes =
    (current - previous) / 1000 / 60;

  if (
    previousLocation !== newLocation &&
    minutes < 60
  ) {
    return {
      anomaly: true,

      severity: "CRITICAL",

      reason:
        "Impossible geographic movement detected",
    };
  }

  return {
    anomaly: false,
  };
}