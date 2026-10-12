/**
 * Normalizes a date-only string (YYYY-MM-DD) or Date to UTC calendar day midnight:
 * YYYY-MM-DDT00:00:00.000Z
 *
 * @param {string|Date} dateVal
 * @returns {Date}
 */
const normalizeUtcDate = (dateVal) => {
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('-');
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

/**
 * Calculates rental duration in whole UTC days.
 * rentalDuration = (returnDate - rentalStartDate) / 86400000 ms
 *
 * @param {Date} startDate
 * @param {Date} returnDate
 * @returns {number}
 */
const calculateRentalDuration = (startDate, returnDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((returnDate.getTime() - startDate.getTime()) / msPerDay);
};

module.exports = {
  normalizeUtcDate,
  calculateRentalDuration
};
