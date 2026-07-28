export async function GET() {
  const res = await fetch(
    "https://api.exchangerate.host/latest?base=KES&symbols=USD"
  );

  const data = await res.json();
  const rate = data.rates.USD;

  await supabase.from("exchange_rates").insert({
    usd_rate: rate,
  });

  return Response.json({ success: true, rate });
}