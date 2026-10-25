import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatCurrency';
import ImageWithFallback from '../components/ImageWithFallback';
import DateRangePicker from '../components/DateRangePicker';
import CheckoutModal from '../components/CheckoutModal';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateCartItem,
    clearCart,
    showToast,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeCheckoutItem, setActiveCheckoutItem] = useState(null);

  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleCheckoutLaunch = (item) => {
    if (
      !item.startDate ||
      !item.returnDate ||
      item.durationDays <= 0
    ) {
      showToast(
        'Please select valid rental dates (up to 7 days) before reserving.',
        'error'
      );
      return;
    }

    if (item.durationDays > 7) {
      showToast(
        'Maximum rental duration is 7 days. Please adjust your return date.',
        'error'
      );
      return;
    }

    if (!isAuthenticated) {
      showToast(
        'Please sign in to complete your reservation.',
        'info'
      );
      navigate('/login');
      return;
    }

    setActiveCheckoutItem(item);
  };

  const handleCheckoutComplete = (checkedOutCartKey) => {
    removeFromCart(checkedOutCartKey);
    setActiveCheckoutItem(null);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#F4EFEA] flex items-center justify-center px-4 py-16 text-[#231F20]">
        <div className="max-w-md w-full bg-white border border-[#DFD5CD] p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EBE4DC] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading font-black text-2xl uppercase tracking-tight">
              Your Cart Is Empty
            </h2>
            <p className="text-sm text-[#595553] leading-relaxed">
              Explore our designer wear and add outfits to your rental cart.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="octo-btn inline-flex items-center gap-2 text-xs py-3.5 px-6 uppercase tracking-widest font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const subtotalRentals = cartItems.reduce((sum, item) => {
    if (item.durationDays > 0 && item.durationDays <= 7) {
      return (
        sum +
        item.rentalPrice *
        (item.quantity || 1) *
        item.durationDays
      );
    }

    return sum;
  }, 0);

  const subtotalDeposits = cartItems.reduce(
    (sum, item) => sum + (item.securityDeposit || 0),
    0
  );

  const estimatedCartTotal = subtotalRentals + subtotalDeposits;

  return (
    <main className="w-full min-h-screen bg-[#F4EFEA] text-[#231F20]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-20">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#595553] mb-6 pb-4 border-b border-[#DFD5CD] uppercase tracking-wider">
          <Link to="/" className="hover:text-[#231F20]">
            Home
          </Link>
          <span>/</span>
          <Link to="/catalogue" className="hover:text-[#231F20]">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-[#231F20] font-bold">
            Rental Bag
          </span>
        </nav>

        {/* Page heading */}
        <header className="pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DFD5CD]">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-1">
              Bag & Reservations
            </span>

            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase leading-none">
              Rental Cart ({cartItems.length})
            </h1>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-[#595553] hover:text-red-700 underline font-semibold self-start sm:self-auto"
          >
            Clear All Items
          </button>
        </header>

        {/* Cart items */}
        <section className="w-full space-y-5">
          {cartItems.map((item) => {
            const hasValidDates =
              Boolean(item.startDate) &&
              Boolean(item.returnDate) &&
              item.durationDays > 0 &&
              item.durationDays <= 7;

            const quantity = item.quantity || 1;

            const itemRentalTotal = hasValidDates
              ? item.rentalPrice * quantity * item.durationDays
              : 0;

            const itemTotal =
              itemRentalTotal + (item.securityDeposit || 0);

            return (
              <article
                key={item.cartKey}
                className="w-full min-w-0 bg-white border border-[#DFD5CD] p-4 sm:p-5 lg:p-6 space-y-5 transition-colors hover:border-[#C9BDB2]"
              >
                {/* Product image and information */}
                <div
                  className="w-full min-w-0 gap-4 sm:gap-5"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px minmax(0, 1fr)',
                    alignItems: 'start',
                  }}
                >
                  {/* Fixed-size thumbnail */}
                  <Link
                    to={`/clothing/${item.clothingId}`}
                    aria-label={`View ${item.name}`}
                    className="block overflow-hidden border border-[#DFD5CD] bg-[#EBE4DC]"
                    style={{
                      width: '100px',
                      height: '125px',
                      minWidth: '100px',
                    }}
                  >
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="block"
                      style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        display: 'block',
                      }}
                    />
                  </Link>

                  {/* Product details */}
                  <div className="min-w-0 flex flex-col gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#595553] mb-1">
                            {item.category}
                          </p>

                          <Link
                            to={`/clothing/${item.clothingId}`}
                            className="hover:underline"
                          >
                            <h2 className="font-heading font-black text-base sm:text-lg lg:text-xl uppercase leading-snug break-words">
                              {item.name}
                            </h2>
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartKey)}
                          className="shrink-0 p-2 text-[#595553] hover:text-red-700 transition-colors"
                          title="Remove from Cart"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#595553] mt-2">
                        Daily Rent:{' '}
                        <strong className="text-[#231F20]">
                          {formatINR(item.rentalPrice)}
                        </strong>{' '}
                        / day
                      </p>
                    </div>

                    {/* Size, quantity and deposit */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#DFD5CD] pt-3">
                      <label className="flex items-center gap-2 text-xs">
                        <span className="font-bold uppercase text-[#595553]">
                          Size
                        </span>

                        <select
                          value={item.size}
                          onChange={(e) =>
                            updateCartItem(item.cartKey, {
                              size: e.target.value,
                            })
                          }
                          className="py-1.5 px-2 bg-[#F4EFEA] border border-[#DFD5CD] text-xs font-bold"
                        >
                          {standardSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex items-center gap-2 text-xs">
                        <span className="font-bold uppercase text-[#595553]">
                          Quantity
                        </span>

                        <select
                          value={quantity}
                          onChange={(e) =>
                            updateCartItem(item.cartKey, {
                              quantity: Number(e.target.value),
                            })
                          }
                          className="py-1.5 px-2 bg-[#F4EFEA] border border-[#DFD5CD] text-xs font-bold"
                        >
                          {Array.from(
                            {
                              length: Math.max(
                                1,
                                Math.min(5, item.maxStock || 1)
                              ),
                            },
                            (_, index) => index + 1
                          ).map((number) => (
                            <option key={number} value={number}>
                              {number}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="text-xs text-[#595553]">
                        Deposit:{' '}
                        <strong className="text-[#231F20]">
                          {formatINR(item.securityDeposit)}
                        </strong>{' '}
                        <span>(Refundable)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rental dates */}
                <section className="w-full min-w-0 p-4 sm:p-5 bg-[#F7F3EF] border border-[#DFD5CD] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[11px] sm:text-xs font-heading font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Select Rental Dates (Maximum 7 Days)
                    </h3>

                    {hasValidDates && (
                      <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-1 border border-emerald-300">
                        {item.durationDays} Day
                        {item.durationDays > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <DateRangePicker
                    startDate={item.startDate}
                    endDate={item.returnDate}
                    onStartDateChange={(newStart) =>
                      updateCartItem(item.cartKey, {
                        startDate: newStart,
                      })
                    }
                    onEndDateChange={(newEnd) =>
                      updateCartItem(item.cartKey, {
                        returnDate: newEnd,
                      })
                    }
                    durationDays={item.durationDays}
                    maxDays={7}
                  />
                </section>

                {/* Price breakdown and reservation button */}
                <footer className="border-t border-[#DFD5CD] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    {hasValidDates ? (
                      <>
                        <p className="text-xs text-[#595553]">
                          Estimated Item Total
                        </p>

                        <p className="font-heading font-black text-xl">
                          {formatINR(itemTotal)}
                        </p>

                        <p className="text-[11px] text-[#595553]">
                          ({formatINR(item.rentalPrice)} × {quantity} ×{' '}
                          {item.durationDays} days +{' '}
                          {formatINR(item.securityDeposit)} deposit)
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 flex items-start gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Please choose valid rental start and return
                          dates to calculate the price.
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckoutLaunch(item)}
                    disabled={!hasValidDates}
                    className="octo-btn w-full sm:w-auto sm:min-w-[210px] sm:max-w-[300px] py-3.5 px-6 text-xs uppercase font-black tracking-widest disabled:opacity-40 disabled:pointer-events-none whitespace-normal sm:whitespace-nowrap"
                  >
                    {hasValidDates
                      ? `Reserve Outfit — ${formatINR(itemTotal)}`
                      : 'Set Dates to Reserve'}
                  </button>
                </footer>
              </article>
            );
          })}
        </section>

        {/* Cart summary */}
        <aside className="mt-8 w-full bg-white border border-[#DFD5CD] p-5 sm:p-6 lg:p-7 space-y-5">
          <h2 className="font-heading font-black text-xl uppercase tracking-tight border-b border-[#DFD5CD] pb-4">
            Cart Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-xs">
            <div className="flex justify-between sm:flex-col sm:items-start gap-2 text-[#595553]">
              <span>Total Items</span>
              <strong className="text-[#231F20]">
                {cartItems.length} outfit
                {cartItems.length > 1 ? 's' : ''}
              </strong>
            </div>

            <div className="flex justify-between sm:flex-col sm:items-start gap-2 text-[#595553]">
              <span>Rental Subtotal</span>
              <strong className="text-[#231F20]">
                {formatINR(subtotalRentals)}
              </strong>
            </div>

            <div className="flex justify-between sm:flex-col sm:items-start gap-2 text-[#595553]">
              <span>Refundable Deposits</span>
              <strong className="text-[#231F20]">
                {formatINR(subtotalDeposits)}
              </strong>
            </div>

            <div className="sm:border-l sm:border-[#DFD5CD] sm:pl-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#DFD5CD] flex justify-between sm:flex-col sm:items-start gap-2">
              <span className="font-heading font-black text-[11px] text-[#595553] uppercase tracking-wider">
                Estimated Total
              </span>

              <strong className="font-heading font-black text-2xl sm:text-3xl text-[#231F20]">
                {formatINR(estimatedCartTotal)}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 border-t border-[#DFD5CD] pt-4 text-xs text-[#595553]">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>100% Refundable Security Deposit</span>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Sanitized & Steam Pressed before handover</span>
            </div>
          </div>

          <div className="border-t border-[#DFD5CD] pt-4">
            <Link
              to="/catalogue"
              className="inline-flex items-center justify-center gap-2 border border-[#231F20] px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#231F20] hover:text-[#F4EFEA] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>

      {/* Existing checkout modal */}
      {activeCheckoutItem && (
        <CheckoutModal
          item={
            activeCheckoutItem.rawItem || {
              id: activeCheckoutItem.clothingId,
              name: activeCheckoutItem.name,
              rentalPrice: activeCheckoutItem.rentalPrice,
              securityDeposit: activeCheckoutItem.securityDeposit,
              image: activeCheckoutItem.image,
              availabilityStatus: 'AVAILABLE',
            }
          }
          startDate={activeCheckoutItem.startDate}
          endDate={activeCheckoutItem.returnDate}
          quantity={activeCheckoutItem.quantity || 1}
          durationDays={activeCheckoutItem.durationDays}
          onClose={() =>
            handleCheckoutComplete(activeCheckoutItem.cartKey)
          }
        />
      )}
    </main>
  );
};

export default Cart;