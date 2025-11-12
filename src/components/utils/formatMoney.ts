export const formatMoney = (amount: number | string): string => {
  if (amount == null || amount === "") return "0";
  const num = Number(amount);
  if (isNaN(num)) return "0";
  return `₦ ${num.toLocaleString("en-NG")}`; // Adds commas automatically (₦1,000 → ₦1,000)
};