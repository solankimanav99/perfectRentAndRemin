import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  title = 'No Items Found',
  description = 'There are no items to show at the moment.',
  actionText = 'Browse Collection',
  actionLink = '/catalogue',
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#E8E6E1] p-12 text-center max-w-md mx-auto my-8">
      <div className="w-16 h-16 bg-[#FAF9F6] text-[#C5A059] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E8E6E1]">
        <PackageOpen className="w-8 h-8" />
      </div>
      <h3 className="font-serif-title text-xl font-bold text-[#1C1E21] mb-2">{title}</h3>
      <p className="text-xs text-gray-500 mb-6 leading-relaxed">{description}</p>
      {actionLink && (
        <Link
          to={actionLink}
          className="inline-block px-6 py-2.5 bg-[#121417] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#C5A059] transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
