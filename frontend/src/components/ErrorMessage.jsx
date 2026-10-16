import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

const ErrorMessage = ({ message = 'An error occurred', code, onRetry }) => {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start space-x-3 text-xs my-4">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">{message}</p>
        {code && <span className="text-[10px] text-rose-500 font-mono block mt-0.5">Error Code: {code}</span>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors flex items-center space-x-1 shrink-0"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
