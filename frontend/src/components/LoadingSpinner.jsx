import React from 'react';

const LoadingSpinner = ({ label = 'Loading fashion collection...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-10 h-10 border-3 border-[#E8E6E1] border-t-[#C5A059] rounded-full animate-spin mb-3" />
      <span className="text-xs font-serif-title font-semibold tracking-wider text-gray-600 uppercase">
        {label}
      </span>
    </div>
  );
};

export default LoadingSpinner;
