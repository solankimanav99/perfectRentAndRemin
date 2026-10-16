/**
 * Centralized Indian Rupee (INR) currency formatting utility.
 * Standardizes all pricing displays across the application using en-IN locale format.
 * Examples: formatINR(299) -> "₹299", formatINR(1299) -> "₹1,299", formatINR(12999) -> "₹12,999"
 */
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export default formatINR;
