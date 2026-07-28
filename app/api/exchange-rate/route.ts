export async function GET() {
  const res = await fetch("https://api.exchangerate.host/latest?base=KES&symbols=USD");
  const data = await res.json();

  return Response.json({
    rate: data.rates.USD,
  });
}