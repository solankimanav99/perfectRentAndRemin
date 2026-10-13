const { FINE_PER_DAY } = require('./constants');

/**
 * Calculates late days and fine using UTC calendar days.
 *
 * BR-019 & BR-042:
 * Late days = max(0, actualReturnDate - expectedReturnDate) in UTC calendar days.
 * fine = lateDays * FINE_PER_DAY
 *
 * @param {Date|string} expectedReturnDate
 * @param {Date|string} actualReturnDate
 * @returns {{ lateDays: number, fine: number }}
 */
const calculateFine = (expectedReturnDate, actualReturnDate) => {
  const exp = new Date(expectedReturnDate);
  const act = new Date(actualReturnDate);

  // Calculate UTC calendar-day difference
  const expUtc = Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate());
  const actUtc = Date.UTC(act.getUTCFullYear(), act.getUTCMonth(), act.getUTCDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.floor((actUtc - expUtc) / msPerDay);

  const lateDays = Math.max(0, dayDiff);
  const fine = lateDays * FINE_PER_DAY;

  return { lateDays, fine };
};

module.exports = calculateFine;
