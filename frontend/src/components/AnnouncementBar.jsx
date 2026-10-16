import React from 'react';
import { Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

const AnnouncementBar = () => {
  return (
    <div className="bg-[#231F20] text-[#F4EFEA] py-2 px-4 text-xs font-semibold tracking-widest uppercase flex justify-between items-center border-b border-[#343031]">
      <div className="max-w-[1400px] mx-auto w-full flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-[#DFD5CD]" />
          <span>OCTO · DESIGNER CLOTHING RENTALS FOR WEDDINGS & SPECIAL OCCASIONS</span>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-[11px] text-[#DFD5CD]">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DFD5CD]" />
            <span>100% Sanitized & Fitted</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-[#DFD5CD]" />
            <span>100% Refundable Deposit</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
