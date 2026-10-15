import React from 'react';
import { RotateCcw } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

const FilterSidebar = ({
  categories = [],
  filters = {},
  onChange,
  onReset,
}) => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const priceBrackets = [
    { label: 'All Prices', min: '', max: '' },
    { label: 'Under ₹1,500', min: '', max: '1500' },
    { label: '₹1,500 – ₹2,500', min: '1500', max: '2500' },
    { label: 'Above ₹2,500', min: '2500', max: '' },
  ];

  const handleInputChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 });
  };

  const handlePriceBracket = (min, max) => {
    onChange({ ...filters, minPrice: min, maxPrice: max, page: 1 });
  };

  const isCurrentBracket = (min, max) => {
    return (filters.minPrice || '') === min && (filters.maxPrice || '') === max;
  };

  return (
    <aside className="bg-white border border-[#DFD5CD] p-5 sm:p-6 space-y-6 sticky top-28 text-[#231F20]">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DFD5CD]">
        <h3 className="font-heading font-black text-sm uppercase text-[#231F20] tracking-widest">
          FILTER OUTFITS
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-bold text-[#595553] hover:text-[#231F20] flex items-center space-x-1.5 transition-colors uppercase tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
          CATEGORIES
        </label>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => handleInputChange('category', '')}
            className={`w-full text-left py-2 px-3 font-semibold transition-colors ${
              !filters.category ? 'bg-[#EBE4DC] text-[#231F20] font-black border-l-2 border-[#231F20]' : 'text-[#595553] hover:bg-[#F4EFEA]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.name || filters.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleInputChange('category', cat.name)}
                className={`w-full text-left py-2 px-3 font-semibold transition-colors ${
                  isSelected ? 'bg-[#EBE4DC] text-[#231F20] font-black border-l-2 border-[#231F20]' : 'text-[#595553] hover:bg-[#F4EFEA]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter (INR) */}
      <div className="space-y-2.5 pt-4 border-t border-[#DFD5CD]">
        <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
          RENTAL BUDGET (₹)
        </label>
        <div className="space-y-1 text-xs">
          {priceBrackets.map((bracket, i) => (
            <button
              key={i}
              onClick={() => handlePriceBracket(bracket.min, bracket.max)}
              className={`w-full text-left py-2 px-3 font-semibold transition-colors ${
                isCurrentBracket(bracket.min, bracket.max)
                  ? 'bg-[#EBE4DC] text-[#231F20] font-black border-l-2 border-[#231F20]'
                  : 'text-[#595553] hover:bg-[#F4EFEA]'
              }`}
            >
              {bracket.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="space-y-2.5 pt-4 border-t border-[#DFD5CD]">
        <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
          SELECT SIZE
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleInputChange('size', '')}
            className={`px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wider border transition-colors ${
              !filters.size ? 'bg-[#231F20] text-[#F4EFEA] border-[#231F20]' : 'border-[#DFD5CD] text-[#231F20] hover:border-[#231F20]'
            }`}
          >
            All
          </button>
          {sizes.map((sz) => {
            const isSelected = filters.size === sz;
            return (
              <button
                key={sz}
                onClick={() => handleInputChange('size', isSelected ? '' : sz)}
                className={`px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wider border transition-colors ${
                  isSelected ? 'bg-[#231F20] text-[#F4EFEA] border-[#231F20]' : 'border-[#DFD5CD] text-[#231F20] hover:border-[#231F20]'
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
};

export default FilterSidebar;
