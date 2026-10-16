import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const ProductCard = ({ item }) => {
  const isAvailable = item.availabilityStatus === 'AVAILABLE' && item.quantity > 0;

  return (
    <div className="flex flex-col h-full group relative bg-transparent">
      
      {/* Top Image Container with Octo Hover Lift and Smooth 1.04 Image Zoom */}
      <Link 
        to={`/clothing/${item.id}`} 
        className="block relative aspect-[4/5] bg-[#EBE4DC] overflow-hidden octo-card-hover border border-transparent hover:border-[#231F20]"
      >
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover object-center group-hover:scale-[1.05] transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {/* Badges (Minimalist Octo) */}
        {!isAvailable ? (
          <div className="absolute top-0 left-0 bg-[#231F20] text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 z-10">
            UNAVAILABLE
          </div>
        ) : (
          <div className="absolute top-2 left-2 bg-[#231F20]/80 backdrop-blur-xs text-[#F4EFEA] text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 z-10">
            RENTAL
          </div>
        )}

        {/* Hover Quick Action */}
        <div className="absolute bottom-0 inset-x-0 bg-[#231F20] text-[#F4EFEA] text-xs font-bold tracking-widest uppercase py-3.5 flex items-center justify-center space-x-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <ShoppingBag className="w-4 h-4" />
          <span>RENT OUTFIT</span>
        </div>
      </Link>

      {/* Card Info Section */}
      <div className="pt-4 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between">
          <Link to={`/clothing/${item.id}`} className="pr-3">
            <h3 className="font-heading text-sm sm:text-base text-[#231F20] uppercase leading-snug group-hover:underline transition-colors">
              {item.name}
            </h3>
          </Link>
          <div className="text-right whitespace-nowrap">
            <span className="font-heading text-sm sm:text-base font-black text-[#231F20]">
              ₹{item.rentalPrice?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        
        {/* Subtle detail text */}
        <div className="flex items-center text-xs text-[#595553] mt-2 font-medium">
          <span className="uppercase tracking-widest">
            {item.category?.name || item.categoryId?.name || (typeof item.category === 'string' ? item.category : 'Outfit')}
          </span>
          <span className="mx-2">·</span>
          <span>Size {item.size}</span>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
