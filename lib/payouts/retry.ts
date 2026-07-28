export function getNextRetryTime(attempt: number) {
  const delays = [30, 120, 600, 3600, 7200]; // seconds

  const delay =
    delays[Math.min(attempt - 1, delays.length - 1)] ?? 7200;

  return new Date(Date.now() + delay * 1000);
}