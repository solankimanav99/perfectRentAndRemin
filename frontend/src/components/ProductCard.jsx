import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Check } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { useCart } from '../context/CartContext';

const ProductCard = ({ item }) => {
  const isAvailable = item.availabilityStatus === 'AVAILABLE' && item.quantity > 0;
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;

    addToCart(item, { size: item.size || 'M', quantity: 1 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

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
        <div className="absolute bottom-0 inset-x-0 bg-[#231F20] text-[#F4EFEA] text-xs font-bold tracking-widest uppercase py-3 flex items-center justify-around translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10 px-2">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>VIEW DETAILS</span>
          </div>

          {isAvailable && (
            <button
              onClick={handleAddToCart}
              className={`text-[10px] uppercase font-black px-2.5 py-1 transition-colors flex items-center space-x-1 ${
                justAdded ? 'bg-emerald-600 text-white' : 'bg-[#F4EFEA] text-[#231F20] hover:bg-white'
              }`}
              title="Add to Rental Cart"
            >
              {justAdded ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>ADDED</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>+ CART</span>
                </>
              )}
            </button>
          )}
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
        
        {/* Subtle detail text & quick add row */}
        <div className="flex items-center justify-between text-xs text-[#595553] mt-2 font-medium">
          <div className="flex items-center">
            <span className="uppercase tracking-widest">
              {item.category?.name || item.categoryId?.name || (typeof item.category === 'string' ? item.category : 'Outfit')}
            </span>
            <span className="mx-2">·</span>
            <span>Size {item.size}</span>
          </div>

          {isAvailable && (
            <button
              onClick={handleAddToCart}
              className="text-[11px] font-bold text-[#231F20] hover:underline uppercase tracking-wider flex items-center space-x-1"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{justAdded ? 'Added' : 'Add to Cart'}</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
