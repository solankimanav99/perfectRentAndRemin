const mongoose = require('mongoose');

/**
 * Checks whether the current MongoDB connection topology supports multi-document transactions.
 * Transactions require a replica set member or mongos (sharded cluster).
 */
const supportsTransactions = () => {
  const type = mongoose.connection.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
};

/**
 * Executes a work function within a MongoDB session/transaction if supported.
 * If transactions are supported:
 *   - Reuses provided options.session if passed, or
 *   - Starts a new session & transaction, commits upon success, and aborts upon error.
 * If transactions are NOT supported (e.g. single-node standalone MongoDB development instance):
 *   - Executes the work function with session = null.
 */
const withTransaction = async (workFn, options = {}) => {
  if (options.session) {
    return workFn(options.session);
  }

  if (!supportsTransactions()) {
    return workFn(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await workFn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = {
  supportsTransactions,
  withTransaction
};
