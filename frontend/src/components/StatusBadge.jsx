import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: {
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      label: 'Pending Payment',
    },
    CONFIRMED: {
      bg: 'bg-blue-100 text-blue-900 border-blue-300',
      label: 'Booking Confirmed',
    },
    PICKED_UP: {
      bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      label: 'Picked Up',
    },
    RETURNED: {
      bg: 'bg-teal-100 text-teal-900 border-teal-300',
      label: 'Returned',
    },
    COMPLETED: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      label: 'Completed',
    },
    CANCELLED: {
      bg: 'bg-gray-100 text-gray-700 border-gray-300',
      label: 'Cancelled',
    },
    OVERDUE: {
      bg: 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse',
      label: 'Overdue Return',
    },
  };

  const config = statusConfig[status] || {
    bg: 'bg-gray-100 text-gray-800 border-gray-200',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${config.bg}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
