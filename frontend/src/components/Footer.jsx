import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#231F20] text-[#F4EFEA] pt-16 pb-12 overflow-hidden relative border-t border-[#343031]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-20">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Hexagon className="w-6 h-6 fill-current" />
              <span className="font-heading font-black text-2xl tracking-tight">
                RENT WISE
              </span>
            </Link>
            <p className="text-[#DFD5CD] text-sm leading-relaxed max-w-xs mt-4">
              Premium designer sherwanis, lehengas, sarees, and gowns for rent. 
              Wear extraordinary fashion at a fraction of retail prices.
            </p>
          </div>

          {/* Shop Links */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-heading text-xs font-black tracking-widest text-[#DFD5CD]">
              SHOP
            </h4>
            <ul className="space-y-3 text-sm text-[#F4EFEA]">
              <li><Link to="/catalogue" className="hover:text-white transition-colors">All Collection</Link></li>
              <li><Link to="/catalogue?category=Sherwani" className="hover:text-white transition-colors">Sherwanis</Link></li>
              <li><Link to="/catalogue?category=Lehenga" className="hover:text-white transition-colors">Lehengas</Link></li>
              <li><Link to="/catalogue?category=Kurta+Set" className="hover:text-white transition-colors">Kurta Sets</Link></li>
              <li><Link to="/catalogue?category=Evening+Gowns" className="hover:text-white transition-colors">Gowns</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-heading text-xs font-black tracking-widest text-[#DFD5CD]">
              COMPANY
            </h4>
            <ul className="space-y-3 text-sm text-[#F4EFEA]">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link to="/how-it-works#fines" className="hover:text-white transition-colors">Returns & Fines</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Support</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Size guide</span></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-heading text-xs font-black tracking-widest text-[#DFD5CD]">
              JOIN THE RENTAL LIST
            </h4>
            <p className="text-sm text-[#DFD5CD] leading-relaxed mb-6">
              First access to new designer collections, festive restocks, and exclusive offers.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="relative border-b border-[#DFD5CD] pb-2 flex items-center mt-6">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-transparent text-sm text-[#F4EFEA] placeholder-[#DFD5CD] focus:outline-none"
              />
              <button type="submit" className="text-sm font-semibold tracking-widest uppercase flex items-center space-x-1 hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
                <span>JOIN</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-[#DFD5CD] pt-8 border-t border-[#343031]">
          <p>© 2026 Rent Wise — Intelligent Clothing Rental Management. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
      </div>

      {/* Gigantic Watermark */}
      <div className="absolute -bottom-10 left-0 right-0 text-center select-none pointer-events-none opacity-[0.04] overflow-hidden">
        <span className="font-heading text-[25vw] leading-none whitespace-nowrap tracking-tighter">
          RENT
        </span>
      </div>
    </footer>
  );
};

export default Footer;
