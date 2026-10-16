import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle2, ShieldCheck, XCircle, CreditCard, Eye } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { formatINR } from '../utils/formatCurrency';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ImageWithFallback from '../components/ImageWithFallback';
import EmptyState from '../components/EmptyState';

const MyRentals = () => {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [payingBooking, setPayingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [payingLoading, setPayingLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getMyBookings({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      });
      setBookings(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load your rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      await bookingService.cancelBooking(id);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayNow = async () => {
    if (!payingBooking) return;
    setPayingLoading(true);
    try {
      await paymentService.processPayment({
        bookingId: payingBooking.id,
        method: paymentMethod,
      });
      setPayingBooking(null);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Payment failed.');
    } finally {
      setPayingLoading(false);
    }
  };

  const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'COMPLETED', 'CANCELLED', 'OVERDUE'];

  return (
    <div className="bg-[#F4EFEA] min-h-screen py-10 px-4 sm:px-8 max-w-[1400px] mx-auto space-y-8 text-[#231F20]">
      {/* Header */}
      <div className="border-b border-[#DFD5CD] pb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#595553] block mb-2">
          CUSTOMER PORTAL
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#231F20] uppercase tracking-tight">
          MY RENTALS & BOOKINGS
        </h1>
        <p className="text-xs sm:text-sm text-[#595553] mt-1 font-sans">
          Track active bookings, payment status, security deposit returns, and cancellations.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wider transition-all shrink-0 ${
              filterStatus === tab
                ? 'bg-[#231F20] text-[#F4EFEA]'
                : 'bg-white text-[#231F20] border border-[#DFD5CD] hover:border-[#231F20]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchBookings} />}

      {loading ? (
        <LoadingSpinner label="Retrieving rental history..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Rentals Found"
          description="You don't have any bookings matching this status filter."
          actionText="Browse Rental Collection"
          actionLink="/catalogue"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancellable = ['PENDING', 'CONFIRMED'].includes(booking.status);
            const needsPayment = ['PENDING'].includes(booking.status);

            return (
              <div
                key={booking.id}
                className="bg-white border border-[#DFD5CD] p-6 octo-card-hover flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left: Thumbnail & Clothing Info */}
                <div className="flex items-start space-x-4">
                  {booking.clothing?.image ? (
                    <ImageWithFallback
                      src={booking.clothing.image}
                      alt={booking.clothing.name}
                      className="w-20 h-24 object-cover rounded-xs shrink-0 bg-[#F5F7FA]"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-xs bg-[#F5F7FA] flex items-center justify-center text-xs text-gray-400 font-bold">
                      Outfit
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold text-gray-400">
                        #{booking.id}
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>

                    <h3 className="font-heading font-black text-lg text-[#231F20] uppercase">
                      {booking.clothing?.name || 'Designer Outfit'}
                    </h3>

                    <div className="text-xs text-[#595553] space-x-3">
                      <span>Size: {booking.clothing?.size || 'N/A'}</span>
                      <span>•</span>
                      <span>Qty: {booking.quantity}</span>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-[#231F20] font-medium flex items-center space-x-2 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#231F20]" />
                      <span>
                        {new Date(booking.rentalStartDate).toLocaleDateString()} →{' '}
                        {new Date(booking.returnDate).toLocaleDateString()} ({booking.rentalDuration} Days)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Financial Breakdown & Actions */}
                <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-[#DFD5CD] gap-4">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#595553] block">
                      Total Payable
                    </span>
                    <span className="font-heading font-black text-2xl text-[#231F20]">
                      {formatINR(booking.totalAmount)}
                    </span>
                    <span className="text-[10px] text-[#595553] block">
                      (Includes {formatINR(booking.securityDeposit)} refundable deposit)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {needsPayment && (
                      <button
                        onClick={() => setPayingBooking(booking)}
                        className="octo-btn px-4 py-2 text-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </button>
                    )}

                    {isCancellable && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-3.5 py-2 border border-red-300 text-red-700 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBookingDetails(booking)}
                      className="octo-btn-outline px-3.5 py-2 text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs max-w-md w-full p-6 shadow-2xl border border-[#E4E7EB] space-y-4 animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-heading font-bold text-base uppercase text-[#142F63]">
                Booking Reference Details
              </h3>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="text-gray-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#343434]">
              <div className="flex justify-between">
                <span className="text-[#666B73]">Booking ID:</span>
                <span className="font-mono font-bold text-[#142F63]">#{selectedBookingDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666B73]">Status:</span>
                <StatusBadge status={selectedBookingDetails.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#666B73]">Clothing Item:</span>
                <span className="font-bold">{selectedBookingDetails.clothing?.name || 'Outfit'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666B73]">Duration:</span>
                <span>{selectedBookingDetails.rentalDuration} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666B73]">Security Deposit (Refundable):</span>
                <span className="font-bold">{formatINR(selectedBookingDetails.securityDeposit)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-[#142F63] text-sm">
                <span>Total Amount:</span>
                <span>{formatINR(selectedBookingDetails.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="w-full py-2.5 bg-[#142F63] text-white text-xs font-heading font-bold uppercase tracking-wider rounded-xs hover:bg-[#0E2044]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAY NOW MODAL */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xs max-w-sm w-full p-6 shadow-2xl border border-[#E4E7EB] space-y-4 animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-heading font-bold text-base uppercase text-[#142F63]">
                Complete Payment
              </h3>
              <button
                onClick={() => setPayingBooking(null)}
                className="text-gray-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-[#343434]">
              <p>Total Payable for <strong>{payingBooking.clothing?.name}</strong>:</p>
              <p className="font-heading text-2xl font-bold text-[#142F63]">{formatINR(payingBooking.totalAmount)}</p>
              
              <div className="pt-2 space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#142F63] block">Select Payment Method</label>
                {['UPI', 'CARD', 'CASH_ON_PICKUP'].map((method) => (
                  <label key={method} className="flex items-center space-x-2 p-2 border border-[#E4E7EB] rounded-xs cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-[#C52F32]"
                    />
                    <span className="font-bold text-xs">{method.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handlePayNow}
                disabled={payingLoading}
                className="btn-red w-full py-2.5 text-xs shadow-md disabled:opacity-50"
              >
                {payingLoading ? 'Processing...' : `Confirm & Pay ${formatINR(payingBooking.totalAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRentals;
