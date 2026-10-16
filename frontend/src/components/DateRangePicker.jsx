import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  durationDays = 0,
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-2">
            RENTAL START (PICKUP)
          </label>
          <input
            type="date"
            min={today}
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-0 py-2 text-sm bg-transparent border-b border-[#231F20] focus:outline-none font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-2">
            RETURN DATE
          </label>
          <input
            type="date"
            min={startDate || today}
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-0 py-2 text-sm bg-transparent border-b border-[#231F20] focus:outline-none font-bold"
          />
        </div>
      </div>

      {durationDays > 0 && (
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#595553]">
          TOTAL RENTAL DURATION: {durationDays} DAY{durationDays > 1 ? 'S' : ''}
        </p>
      )}

      {startDate && endDate && durationDays <= 0 && (
        <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold uppercase tracking-widest pt-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Return date must be at least 1 day after the start date.</span>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
