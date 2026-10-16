/**
 * Normalizes a date string (YYYY-MM-DD) to a UTC calendar date at midnight.
 * Prevents timezone offset shifts and off-by-one calendar errors.
 */
export const normalizeUtcDate = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }
  const d = new Date(dateVal);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

export const calculateRentalDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = normalizeUtcDate(startDate);
  const end = normalizeUtcDate(endDate);
  if (!start || !end) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  return Math.max(0, diffDays);
};
