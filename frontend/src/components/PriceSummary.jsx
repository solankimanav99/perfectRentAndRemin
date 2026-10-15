import React from 'react';
import { formatINR } from '../utils/formatCurrency';

const PriceSummary = ({
  rentalPrice = 0,
  quantity = 1,
  durationDays = 1,
  securityDeposit = 0,
}) => {
  const rentalAmount = rentalPrice * quantity * durationDays;
  const totalAmount = rentalAmount + securityDeposit;

  return (
    <div className="bg-[#EBE4DC] border border-[#DFD5CD] p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#DFD5CD] pb-2.5">
        <h4 className="font-heading text-xs font-black uppercase tracking-widest text-[#231F20]">
          RENTAL PRICE BREAKDOWN
        </h4>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#595553] bg-white/70 px-2 py-0.5 border border-[#DFD5CD]">
          100% Transparent
        </span>
      </div>

      <div className="space-y-2.5 text-xs text-[#231F20]">
        <div className="flex justify-between items-center">
          <span className="text-[#595553]">
            Rental Charge ({formatINR(rentalPrice)} × {quantity} outfit{quantity > 1 ? 's' : ''} × {durationDays} day{durationDays > 1 ? 's' : ''})
          </span>
          <span className="font-heading font-black text-sm text-[#231F20]">
            {formatINR(rentalAmount)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#595553]">
            Refundable Security Deposit <span className="text-[10px] block sm:inline">(Returned on return)</span>
          </span>
          <span className="font-heading font-black text-sm text-[#231F20]">
            {formatINR(securityDeposit)}
          </span>
        </div>

        <div className="pt-2.5 border-t border-[#DFD5CD] flex justify-between items-baseline text-[#231F20]">
          <div>
            <span className="font-heading font-black text-sm uppercase tracking-wider block text-[#231F20]">
              TOTAL PAYABLE NOW
            </span>
            <span className="text-[10px] text-[#595553]">
              Includes {formatINR(securityDeposit)} refundable deposit
            </span>
          </div>
          <span className="font-heading text-2xl font-black text-[#231F20]">
            {formatINR(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;
