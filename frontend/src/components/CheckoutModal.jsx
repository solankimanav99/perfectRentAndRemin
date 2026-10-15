import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { formatINR } from '../utils/formatCurrency';
import PriceSummary from './PriceSummary';
import ErrorMessage from './ErrorMessage';

const CheckoutModal = ({
  item,
  startDate,
  endDate,
  quantity,
  durationDays,
  onClose,
}) => {
  const [step, setStep] = useState('summary'); // 'summary' | 'payment' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentResult, setPaymentResult] = useState(null);

  const handleCreateBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookingData = {
        clothingId: item.id,
        rentalStartDate: startDate,
        returnDate: endDate,
        quantity,
      };
      const result = await bookingService.createBooking(bookingData);
      setCreatedBooking(result);
      setStep('payment');
    } catch (err) {
      if (err.message && err.message.includes('BOOKING_OVERLAP')) {
        setError('This outfit is already reserved for these dates. Please select alternative dates.');
      } else {
        setError(err.message || 'Failed to create booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdBooking) return;
    setLoading(true);
    setError(null);
    try {
      const payData = {
        bookingId: createdBooking.id,
        method: paymentMethod,
      };
      const payRes = await paymentService.processPayment(payData);
      setPaymentResult(payRes);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#F4EFEA] max-w-lg w-full shadow-2xl relative border border-[#DFD5CD] overflow-hidden text-[#231F20]">
        
        {/* Header */}
        <div className="bg-[#EBE4DC] border-b border-[#DFD5CD] p-5 sm:p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#595553] block mb-1">
              SECURE RENTAL CHECKOUT
            </span>
            <h3 className="font-heading font-black text-xl uppercase tracking-wider text-[#231F20]">
              {step === 'summary' && 'REVIEW & CONFIRM RENTAL'}
              {step === 'payment' && 'CHOOSE PAYMENT METHOD'}
              {step === 'success' && 'RENTAL RESERVED SUCCESSFULLY'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#595553] hover:text-[#231F20] p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* STEP 1: SUMMARY */}
          {step === 'summary' && (
            <>
              <div className="flex items-center space-x-4 p-3.5 bg-[#EBE4DC] border border-[#DFD5CD]">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-16 aspect-[3/4] object-cover shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#595553] block">
                    {item.category?.name || 'Festive Wear'}
                  </span>
                  <h4 className="font-heading font-black text-base uppercase text-[#231F20] truncate">
                    {item.name}
                  </h4>
                  <div className="text-xs text-[#595553] space-x-2 mt-1">
                    <span>Size: {item.size}</span>
                    <span>•</span>
                    <span>Qty: {quantity}</span>
                  </div>
                </div>
              </div>

              <PriceSummary
                rentalPrice={item.rentalPrice}
                quantity={quantity}
                durationDays={durationDays}
                securityDeposit={item.securityDeposit}
              />

              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="octo-btn w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                {loading ? 'Reserving Dates...' : 'Confirm Dates & Continue to Payment'}
              </button>
            </>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && createdBooking && (
            <>
              <div className="p-4 bg-[#EBE4DC] border border-[#DFD5CD] text-[#231F20] space-y-1">
                <span className="font-heading font-black text-xs uppercase tracking-wider block text-[#231F20]">
                  Booking Reserved
                </span>
                <p className="text-xs">
                  Booking ID: <span className="font-mono font-bold text-[#231F20]">#{createdBooking.id}</span>
                </p>
                <p className="text-xs pt-1">
                  Total Payable Now: <span className="font-heading font-black text-lg text-[#231F20] ml-1">{formatINR(createdBooking.totalAmount)}</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
                  CHOOSE PAYMENT OPTION
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', icon: QrCode, label: 'UPI' },
                    { id: 'CARD', icon: CreditCard, label: 'Card' },
                    { id: 'CASH_ON_PICKUP', icon: Banknote, label: 'Cash on Handover' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3.5 border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        paymentMethod === method.id
                          ? 'border-[#231F20] bg-white text-[#231F20] shadow-sm ring-1 ring-[#231F20]'
                          : 'border-[#DFD5CD] text-[#595553] hover:border-[#231F20]'
                      }`}
                    >
                      <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-[#231F20]' : 'text-gray-400'}`} />
                      <span className="text-xs font-bold uppercase">{method.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-[#595553] italic text-center pt-1">
                  * Note: Payments are simulated for project demonstration. No real money is charged.
                </p>
              </div>

              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="octo-btn w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                {loading
                  ? 'Processing Payment...'
                  : paymentMethod === 'CASH_ON_PICKUP'
                  ? 'Confirm Cash on Pickup'
                  : `Pay ${formatINR(createdBooking.totalAmount)}`}
              </button>
            </>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && paymentResult && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-[#EBE4DC] text-[#231F20] flex items-center justify-center mx-auto rounded-full ring-8 ring-[#DFD5CD]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-heading font-black text-2xl uppercase tracking-tight text-[#231F20]">
                  Rental Confirmed!
                </h4>
                <p className="text-xs text-[#595553] mt-1 max-w-sm mx-auto">
                  Your outfit has been reserved. You can view booking details and track rental status in My Rentals.
                </p>
              </div>

              <div className="border border-[#DFD5CD] bg-[#EBE4DC] p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#595553]">Booking Reference:</span>
                  <span className="font-mono font-bold text-[#231F20]">#{createdBooking?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#595553]">Payment Status:</span>
                  <span className="font-bold text-[#231F20]">{paymentResult?.status || 'PAID'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#595553]">Amount Paid:</span>
                  <span className="font-bold text-[#231F20]">{formatINR(createdBooking?.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="octo-btn w-full py-3.5 text-xs font-bold uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
