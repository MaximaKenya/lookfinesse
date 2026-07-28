const SANCTIONED_COUNTRIES = [
  "North Korea",
  "Iran",
  "Syria",
];

export function checkSanctions(country: string) {
  return SANCTIONED_COUNTRIES.includes(
    country
  );
}