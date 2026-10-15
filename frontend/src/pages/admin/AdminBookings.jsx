import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Check, X, RefreshCw, Play, ArrowRight } from 'lucide-react';
import { formatINR } from '../../utils/formatCurrency';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getAllBookings();
      setBookings(result.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminService.updateBookingStatus(id, newStatus);
      fetchBookings();
    } catch (err) {
      alert(`Status transition failed: ${err.message}`);
    }
  };

  if (loading && bookings.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBookings} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif-title text-3xl font-extrabold text-[#1C1E21]">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage rental bookings and valid status transitions.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">ID / Item</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => {
              const bId = booking.id || booking._id;
              const itemName = booking.clothing?.name || booking.clothingId || 'Outfit';

              return (
                <tr key={bId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-gray-900">{bId}</div>
                    <div className="text-xs text-gray-500">{itemName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">
                      {new Date(booking.rentalStartDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {new Date(booking.returnDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{booking.quantity}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{formatINR(booking.totalAmount)}</div>
                    <div className="text-[10px] text-gray-400">Dep: {formatINR(booking.securityDeposit)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-700'
                          : booking.status === 'PICKED_UP'
                          ? 'bg-purple-100 text-purple-700'
                          : booking.status === 'RETURNED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : booking.status === 'COMPLETED'
                          ? 'bg-gray-100 text-gray-700'
                          : booking.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-700'
                          : booking.status === 'CANCELLED'
                          ? 'bg-zinc-100 text-zinc-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {booking.status === 'PENDING' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(bId, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold flex items-center space-x-1 hover:bg-blue-700"
                          title="Confirm (Cash on Pickup only)"
                        >
                          <Check className="w-3.5 h-3.5" /> <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(bId, 'CANCELLED')}
                          className="p-1 text-rose-600 hover:text-rose-900"
                          title="Cancel Booking"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(bId, 'PICKED_UP')}
                          className="px-2.5 py-1 bg-purple-700 text-white rounded text-xs font-bold flex items-center space-x-1 hover:bg-purple-800"
                          title="Record Handover / Pickup"
                        >
                          <Play className="w-3.5 h-3.5" /> <span>Handover</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(bId, 'CANCELLED')}
                          className="p-1 text-rose-600 hover:text-rose-900"
                          title="Cancel Booking"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {['PICKED_UP', 'OVERDUE'].includes(booking.status) && (
                      <Link
                        to="/admin/returns"
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 underline flex items-center space-x-1"
                      >
                        <span>Process Return</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    {booking.status === 'RETURNED' && (
                      <Link
                        to="/admin/returns"
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center space-x-1"
                      >
                        <span>Settle Deposit</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    {['COMPLETED', 'CANCELLED'].includes(booking.status) && (
                      <span className="text-xs text-gray-400 font-medium">Final state</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookings;
