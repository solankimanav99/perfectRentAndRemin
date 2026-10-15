import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';
import { clothingService } from '../services/clothingService';
import ProductCard from '../components/ProductCard';
import ScrollReveal from '../components/ScrollReveal';

const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, clothesData] = await Promise.all([
          clothingService.getCategories(),
          clothingService.getAllClothing({ limit: 6 }), 
        ]);
        setCategories(cats || []);
        setFeaturedItems(clothesData.items ? clothesData.items.slice(0, 6) : []);
      } catch (e) {
        console.error('Home page data error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryImages = {
    'Evening Gowns': '/assets/midnight_black_gown.jpg',
    'Kurta Set': '/assets/kurta_set.jpg',
    'Lehenga': '/assets/crimson_bridal_lehenga.jpg',
    'Sherwani': '/assets/maroon_sherwani.jpg',
  };

  return (
    <div className="bg-[#F4EFEA] min-h-screen text-[#231F20]">
      
      {/* 1. HERO SECTION (Original Octo Hero) */}
      <section className="pt-20 pb-24 text-center px-4 max-w-[1400px] mx-auto border-b border-[#DFD5CD]">
        <ScrollReveal delayIndex={1}>
          <div className="flex items-center justify-center space-x-2 text-xs font-bold tracking-widest text-[#595553] uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-[#595553]" />
            <span>DESIGNER OUTFITS · RENT FOR LESS</span>
            <span className="w-2 h-2 rounded-full bg-[#595553]" />
          </div>
        </ScrollReveal>

        <ScrollReveal delayIndex={2}>
          <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[#231F20] leading-[0.9] uppercase max-w-5xl mx-auto mb-8 tracking-tight">
            FIND YOUR<br/>PERFECT LOOK
          </h1>
        </ScrollReveal>

        <ScrollReveal delayIndex={3}>
          <p className="text-lg text-[#595553] max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Premium designer sherwanis, bridal lehengas, and evening gowns. 
            Available for your special occasions at a fraction of retail prices.
          </p>
        </ScrollReveal>

        <ScrollReveal delayIndex={4}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/catalogue" className="octo-btn">
              EXPLORE NOW <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link to="/how-it-works" className="octo-btn-outline">
              HOW IT WORKS
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. COLLECTION SHOWCASE (Octo Grid) */}
      <section className="py-24 px-4 sm:px-8 max-w-[1400px] mx-auto border-b border-[#DFD5CD]">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-2">
                THE CURRENT COLLECTION
              </span>
              <h2 className="font-heading text-4xl sm:text-6xl text-[#231F20] tracking-tight">
                EXPLORE THE<br/>COLLECTION
              </h2>
            </div>
            <Link 
              to="/catalogue" 
              className="text-xs font-bold tracking-widest uppercase border-b border-[#231F20] pb-1 hover:text-[#595553] hover:border-[#595553] transition-colors"
            >
              VIEW ALL OUTFITS ↗
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-16 text-[#595553] text-sm font-medium">Loading featured outfits...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {featuredItems.map((item, idx) => (
              <ScrollReveal key={item.id} delayIndex={(idx % 3) + 1}>
                <ProductCard item={item} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* 3. CATEGORIES / FASHION LIBRARY */}
      <section className="py-24 px-4 sm:px-8 max-w-[1400px] mx-auto border-b border-[#DFD5CD]">
        <ScrollReveal>
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-2">
              THE FASHION LIBRARY
            </span>
            <h2 className="font-heading text-4xl sm:text-6xl text-[#231F20] mb-6 tracking-tight">
              PREMIUM LABELS.<br/>ONE PLATFORM.
            </h2>
            <p className="text-lg text-[#595553] max-w-xl leading-relaxed">
              We keep our curation exclusive on purpose. Each outfit is chosen for its craftsmanship, fabric quality, and timeless appeal.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const bgImage = categoryImages[cat.name] || '/assets/maroon_royal_sherwani.jpg';
            
            return (
              <ScrollReveal key={cat.id || idx} delayIndex={idx + 1}>
                <Link
                  to={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                  className="group relative aspect-square p-6 flex flex-col justify-between overflow-hidden border border-transparent hover:border-[#231F20] transition-all octo-card-hover h-full"
                >
                  {/* Background Image with Smooth Zoom */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={bgImage} 
                      alt={cat.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 group-hover:bg-black/50 transition-colors duration-300" />
                  </div>
                  
                  {/* Text Content */}
                  <h3 className="font-heading text-2xl text-[#F4EFEA] relative z-10 drop-shadow-md">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-bold tracking-widest uppercase text-[#F4EFEA] relative z-10 group-hover:translate-x-2 transition-transform duration-300 flex items-center space-x-1">
                    <span>BROWSE</span>
                    <span>↗</span>
                  </span>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 4. STATISTICS / PROCESS (Octo Minimalist Process) */}
      <section className="py-24 px-4 sm:px-8 max-w-[1400px] mx-auto border-b border-[#DFD5CD]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <ScrollReveal delayIndex={1}>
            <h3 className="font-heading text-7xl sm:text-8xl text-[#231F20] mb-4">3</h3>
            <p className="text-xs font-bold tracking-widest uppercase text-[#595553]">
              SIMPLE STEPS TO RENT
            </p>
          </ScrollReveal>
          <ScrollReveal delayIndex={2}>
            <h3 className="font-heading text-7xl sm:text-8xl text-[#231F20] mb-4">100%</h3>
            <p className="text-xs font-bold tracking-widest uppercase text-[#595553]">
              REFUNDABLE SECURITY DEPOSIT
            </p>
          </ScrollReveal>
          <ScrollReveal delayIndex={3}>
            <h3 className="font-heading text-7xl sm:text-8xl text-[#231F20] mb-4">0</h3>
            <p className="text-xs font-bold tracking-widest uppercase text-[#595553]">
              DRY CLEANING HASSLE
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. BANNER (Octo Watermark Style) */}
      <section className="py-32 px-4 sm:px-8 relative overflow-hidden bg-[#EBE4DC]">
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-start">
          <ScrollReveal>
            <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-3">
              DEMAND IS HIGH
            </span>
            <h2 className="font-heading text-5xl sm:text-7xl lg:text-8xl text-[#231F20] mb-6 max-w-4xl uppercase leading-[0.9] tracking-tight">
              FESTIVE SEASONS<br/>BOOK FAST
            </h2>
            <p className="text-[#595553] text-lg max-w-xl mb-10 leading-relaxed font-sans">
              Limited inventory per size. Once an outfit is booked for your dates, it is reserved — secure your dates before someone else does.
            </p>
            <Link to="/catalogue" className="octo-btn">
              SECURE YOUR DATES <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </ScrollReveal>
        </div>

        {/* Gigantic Watermark */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[25%] text-center select-none pointer-events-none opacity-[0.07]">
          <span className="font-heading text-[26vw] leading-none whitespace-nowrap tracking-tighter">
            RESERVE
          </span>
        </div>
      </section>

    </div>
  );
};

export default Home;
