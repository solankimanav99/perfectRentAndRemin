import React from 'react';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';

const ProductGrid = ({ items = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col h-full animate-pulse bg-transparent">
            <div className="aspect-[4/5] bg-[#EBE4DC]" />
            <div className="pt-4 space-y-3">
              <div className="h-4 bg-[#EBE4DC] w-3/4" />
              <div className="h-3 bg-[#EBE4DC] w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-24 px-4 bg-transparent border border-[#DFD5CD]">
        <h3 className="font-heading text-xl text-[#231F20] mb-2 uppercase">NO ITEMS FOUND</h3>
        <p className="text-sm text-[#595553] max-w-md mx-auto">
          We couldn't find any clothing matching your current search or filter criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
      {items.map((item, idx) => (
        <ScrollReveal key={item.id} delayIndex={(idx % 3) + 1}>
          <ProductCard item={item} />
        </ScrollReveal>
      ))}
    </div>
  );
};

export default ProductGrid;
