import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { ShieldCheck, Plus, X } from 'lucide-react';
import { formatINR } from '../../utils/formatCurrency';

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processData, setProcessData] = useState({
    bookingId: '',
    actualReturnDate: new Date().toISOString().split('T')[0],
    condition: 'GOOD',
  });
  const [processLoading, setProcessLoading] = useState(false);
  const [processError, setProcessError] = useState(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllReturns();
      setReturns(result.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch returns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    setProcessLoading(true);
    setProcessError(null);
    try {
      await adminService.processReturn({
        bookingId: processData.bookingId.trim(),
        actualReturnDate: processData.actualReturnDate,
        condition: processData.condition,
      });
      setIsProcessModalOpen(false);
      setProcessData({
        bookingId: '',
        actualReturnDate: new Date().toISOString().split('T')[0],
        condition: 'GOOD',
      });
      fetchReturns();
    } catch (err) {
      setProcessError(err.message || 'Failed to process return.');
    } finally {
      setProcessLoading(false);
    }
  };

  const handleSettle = async (id) => {
    const dmg = window.prompt('Enter damage charge to deduct from deposit (0 if none):', '0');
    if (dmg === null) return;
    try {
      await adminService.settleReturn(id, Number(dmg));
      fetchReturns();
    } catch (err) {
      alert(`Settle failed: ${err.message}`);
    }
  };

  if (loading && returns.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReturns} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-3xl font-black text-[#231F20] uppercase tracking-wide">Returns & Fines</h1>
          <p className="text-sm text-[#595553] mt-1">Record physical outfit returns and settle security deposits.</p>
        </div>
        <button
          onClick={() => setIsProcessModalOpen(true)}
          className="octo-btn px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" /> <span>Process Return</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Condition</th>
              <th className="px-6 py-4">Late Days</th>
              <th className="px-6 py-4">Late Fine</th>
              <th className="px-6 py-4">Deposit Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {returns.map((r) => {
              const bookingIdStr = typeof r.bookingId === 'object' ? r.bookingId?.id || r.bookingId?._id : r.bookingId;
              const fineAmount = r.fine !== undefined ? r.fine : (r.lateFine || 0);
              const isSettled = r.settled;

              return (
                <tr key={r.id || r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-xs">{bookingIdStr}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        r.condition === 'EXCELLENT' || r.condition === 'GOOD'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{r.lateDays || 0} days</td>
                  <td className="px-6 py-4 text-red-600 font-bold">{formatINR(fineAmount)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        isSettled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isSettled ? 'SETTLED' : 'PENDING SETTLEMENT'}
                    </span>
                    {isSettled && r.depositRefunded !== undefined && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Refunded: {formatINR(r.depositRefunded)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!isSettled ? (
                      <button
                        onClick={() => handleSettle(r.id || r._id)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase"
                      >
                        Settle Deposit
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1 text-emerald-600 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {returns.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No return records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isProcessModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-black text-[#231F20] uppercase">Process Physical Return</h2>
              <button
                onClick={() => setIsProcessModalOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {processError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                {processError}
              </div>
            )}

            <form onSubmit={handleProcessReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Booking ID</label>
                <input
                  type="text"
                  required
                  value={processData.bookingId}
                  onChange={(e) => setProcessData({ ...processData, bookingId: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black font-mono text-sm"
                  placeholder="24-char ObjectId"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Actual Return Date</label>
                <input
                  type="date"
                  required
                  value={processData.actualReturnDate}
                  onChange={(e) => setProcessData({ ...processData, actualReturnDate: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Garment Condition</label>
                <select
                  value={processData.condition}
                  onChange={(e) => setProcessData({ ...processData, condition: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="mr-3 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processLoading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {processLoading ? 'Recording...' : 'Record Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;
