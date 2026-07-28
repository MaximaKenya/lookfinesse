export async function sendMpesaPayout(phone: string, amount: number) {
  const res = await fetch("https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest", {
    method: "POST",
    headers: {
      Authorization: `Bearer YOUR_ACCESS_TOKEN`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      InitiatorName: "testapi",
      SecurityCredential: "YOUR_ENCRYPTED_PASSWORD",
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: "YOUR_SHORTCODE",
      PartyB: phone,
      Remarks: "Payout",
      QueueTimeOutURL: "https://yourdomain/api/mpesa/timeout",
      ResultURL: "https://yourdomain/api/mpesa/result",
    }),
  });

  return res.json();
}