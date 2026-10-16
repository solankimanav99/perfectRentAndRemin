import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  RefreshCw, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  Heart, 
  Truck, 
  CheckCircle2, 
  Star, 
  Info,
  Maximize2,
  Share2
} from 'lucide-react';
import { clothingService } from '../services/clothingService';
import { calculateRentalDuration } from '../utils/calculateRental';
import { formatINR } from '../utils/formatCurrency';
import ImageWithFallback from '../components/ImageWithFallback';
import DateRangePicker from '../components/DateRangePicker';
import PriceSummary from '../components/PriceSummary';
import CheckoutModal from '../components/CheckoutModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction State
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rental Configuration State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await clothingService.getClothingById(id);
        setItem(data);
        setSelectedImage(data.image);
        setSelectedSize(data.size || 'M');

        // Fetch related products in the same category
        const catName = data.category?.name || data.categoryId?.name || data.category;
        if (catName) {
          const related = await clothingService.getAllClothing({
            category: catName,
            limit: 6,
          });
          setRelatedItems((related.items || []).filter((r) => r.id !== id));
        }
      } catch (err) {
        setError(err.message || 'Failed to load outfit details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const durationDays = startDate && endDate ? calculateRentalDuration(startDate, endDate) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner label="Loading designer outfit..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
        <ErrorMessage message={error || 'Outfit not found'} />
        <div className="mt-6">
          <Link to="/catalogue" className="btn-red inline-flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Catalogue</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = item.availabilityStatus === 'AVAILABLE' && item.quantity > 0;
  const retailEstimate = (item.rentalPrice || 1500) * 8;
  const categoryLabel = item.category?.name || item.categoryId?.name || (typeof item.category === 'string' ? item.category : 'Designer Outfits');

  const galleryImages = (Array.isArray(item.images) && item.images.length > 0)
    ? item.images.filter(Boolean)
    : [item.image].filter(Boolean);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="bg-[#F4EFEA] min-h-screen pt-8 pb-24 px-4 sm:px-8 max-w-[1400px] mx-auto text-[#231F20]">
      
      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-semibold text-[#595553] flex items-center space-x-2 mb-8 pb-4 border-b border-[#DFD5CD] uppercase tracking-wider">
        <Link to="/" className="hover:text-[#231F20] transition-colors">Home</Link>
        <span>/</span>
        <Link to="/catalogue" className="hover:text-[#231F20] transition-colors">Catalogue</Link>
        <span>/</span>
        <span className="text-[#231F20]">{categoryLabel}</span>
        <span>/</span>
        <span className="text-[#231F20] truncate font-bold">{item.name}</span>
      </nav>

      {/* Main Product Showcase — Octo 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* LEFT COLUMN: Vertical Thumbnail Gallery + Main Large Image */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 items-start">
          
          {/* Vertical Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="flex sm:flex-col gap-3 w-full sm:w-20 overflow-x-auto sm:overflow-visible flex-shrink-0">
              {galleryImages.map((imgSrc, idx) => {
                const isActive = (selectedImage || item.image) === imgSrc;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgSrc)}
                    className={`aspect-[3/4] w-16 sm:w-20 overflow-hidden border-2 transition-all bg-[#EBE4DC] flex-shrink-0 ${
                      isActive
                        ? 'border-[#231F20]'
                        : 'border-[#DFD5CD] opacity-70 hover:opacity-100 hover:border-[#231F20]'
                    }`}
                    aria-label={`View angle ${idx + 1}`}
                  >
                    <ImageWithFallback
                      src={imgSrc}
                      alt={`${item.name} view ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Large Product Frame */}
          <div className="flex-1 w-full aspect-[3/4] bg-[#EBE4DC] overflow-hidden border border-[#DFD5CD] shadow-sm relative group octo-card-hover">
            <ImageWithFallback
              src={selectedImage || item.image}
              alt={item.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              <span className="bg-[#231F20] text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                {categoryLabel}
              </span>
              {!isAvailable ? (
                <span className="bg-[#595553] text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Currently Reserved
                </span>
              ) : (
                <span className="bg-[#231F20]/80 backdrop-blur-xs text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Available For Rent
                </span>
              )}
            </div>

            {/* Quick Actions (Wishlist & Share) */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-10 h-10 border border-[#231F20] flex items-center justify-center transition-all ${
                  isWishlisted
                    ? 'bg-[#231F20] text-[#F4EFEA]'
                    : 'bg-white text-[#231F20] hover:bg-[#231F20] hover:text-[#F4EFEA]'
                }`}
                title={isWishlisted ? 'Saved' : 'Save'}
                aria-label="Wishlist outfit"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 border border-[#231F20] bg-white hover:bg-[#231F20] text-[#231F20] hover:text-[#F4EFEA] flex items-center justify-center transition-all"
                title="Share outfit link"
                aria-label="Share outfit"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {copiedLink && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#231F20] text-[#F4EFEA] text-xs font-bold px-4 py-2 border border-[#DFD5CD] shadow-lg">
                Link copied to clipboard!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Outfit Details, Selection & Reservation Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header & Pricing */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="bg-[#231F20] text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-2.5 py-1">
                {item.condition || 'EXCELLENT'} CONDITION
              </span>
              <span className="text-xs text-[#595553] font-semibold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sanitized & Steam Pressed</span>
              </span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#231F20] uppercase leading-tight tracking-tight">
              {item.name}
            </h1>

            {/* Price Showcase */}
            <div className="flex items-baseline space-x-3 pt-3">
              <span className="font-heading font-black text-3xl sm:text-4xl text-[#231F20]">
                {formatINR(item.rentalPrice)}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#595553]">/ DAY</span>
              <span className="text-sm text-[#595553] line-through font-mono">
                MRP {formatINR(retailEstimate)}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#343434] leading-relaxed">
            {item.description || 'Exquisite authentic designer wear tailored with heritage fabrics and detailed embroidery. Sanitized, pressed, and delivered ready for your special occasion.'}
          </p>

          {/* Color Selector */}
          <div className="space-y-2 pt-2 border-t border-[#DFD5CD]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#231F20]">
                Color: <span className="font-normal text-[#595553]">{item.color || 'Standard'}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2.5">
              <button 
                className="w-7 h-7 rounded-none border-2 border-[#231F20] p-0.5"
                title={item.color || 'Standard'}
              >
                <span className="block w-full h-full bg-[#231F20]" />
              </button>
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2 pt-2 border-t border-[#DFD5CD]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#231F20]">
                Size: <span className="font-black text-[#231F20]">{selectedSize}</span>
              </span>
              <button 
                onClick={() => setActiveTab('fit')}
                className="text-xs text-[#595553] hover:text-[#231F20] underline font-semibold transition-colors uppercase tracking-wider"
              >
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {standardSizes.map((sz) => {
                const isCurrent = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-12 h-10 text-xs font-heading font-black uppercase tracking-wider border transition-all ${
                      isCurrent
                        ? 'bg-[#231F20] text-[#F4EFEA] border-[#231F20]'
                        : 'border-[#DFD5CD] bg-white text-[#231F20] hover:border-[#231F20]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rental Dates Configuration Box — Octo Warm Box */}
          <div className="p-6 bg-[#EBE4DC] border border-[#DFD5CD] space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-black text-sm uppercase text-[#231F20] tracking-widest">
                  SELECT RENTAL DATES
                </h3>
                <span className="text-xs font-bold text-[#595553]">
                  ₹100/day late fee rule
                </span>
              </div>
              <p className="text-xs text-[#595553] mt-0.5">
                Choose start date and scheduled return date.
              </p>
            </div>

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              durationDays={durationDays}
            />

            {/* Quantity */}
            <div className="flex items-center justify-between pt-3 border-t border-[#DFD5CD]">
              <div>
                <span className="text-xs font-bold text-[#231F20] block">Quantity</span>
                <span className="text-[11px] text-[#595553]">Max {Math.min(5, item.quantity || 1)} in stock</span>
              </div>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="py-1.5 px-3 bg-white border border-[#DFD5CD] text-xs font-bold text-[#231F20] focus:outline-none focus:border-[#231F20]"
              >
                {[...Array(Math.min(5, item.quantity || 1))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} item{i > 0 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Estimated Price Breakdown */}
            {startDate && endDate && durationDays > 0 && (
              <PriceSummary
                rentalPrice={item.rentalPrice}
                quantity={quantity}
                durationDays={durationDays}
                securityDeposit={item.securityDeposit}
              />
            )}

            {/* Booking Trigger Button (Octo CTA) */}
            <div className="pt-2">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={!startDate || !endDate || durationDays <= 0 || !isAvailable}
                className="octo-btn w-full py-4 text-xs font-black shadow-none disabled:opacity-40 disabled:pointer-events-none tracking-widest uppercase"
              >
                {!isAvailable
                  ? 'Currently Reserved'
                  : !startDate || !endDate
                  ? 'Select Rental Dates to Reserve'
                  : `RESERVE OUTFIT — PAY ${formatINR((item.rentalPrice * quantity * durationDays) + (item.securityDeposit || 0))}`}
              </button>
            </div>

            {/* 3 Trust Assurance Badges */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#DFD5CD] text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#231F20] mb-1" />
                <span className="text-[10px] font-heading font-black uppercase text-[#231F20] leading-tight">Doorstep Delivery</span>
                <span className="text-[9px] text-[#595553]">Prompt Handover</span>
              </div>
              <div className="flex flex-col items-center">
                <RefreshCw className="w-4 h-4 text-[#231F20] mb-1" />
                <span className="text-[10px] font-heading font-black uppercase text-[#231F20] leading-tight">100% Refundable</span>
                <span className="text-[9px] text-[#595553]">Security Deposit</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-[#231F20] mb-1" />
                <span className="text-[10px] font-heading font-black uppercase text-[#231F20] leading-tight">Steam Sanitized</span>
                <span className="text-[9px] text-[#595553]">Clean & Ready</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs: Details, Materials, Care & Sizing, Deposit Policy */}
      <div className="mt-16 bg-white border border-[#DFD5CD] p-6 sm:p-10 shadow-xs">
        
        {/* Tab Headers */}
        <div className="flex space-x-8 border-b border-[#DFD5CD] pb-4 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'details', label: 'Outfit Details' },
            { id: 'materials', label: 'Materials & Craft' },
            { id: 'fit', label: 'Size & Fit Guide' },
            { id: 'policy', label: 'Deposit & Return Rules' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs sm:text-sm font-heading font-black uppercase tracking-wider pb-2 transition-colors relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-[#231F20]' : 'text-[#595553] hover:text-[#231F20]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-[-17px] left-0 w-full h-[2.5px] bg-[#231F20]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content & Split Editorial Feature */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-7 text-xs sm:text-sm text-[#343434] leading-relaxed space-y-4">
            {activeTab === 'details' && (
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-lg text-[#142F63] uppercase">
                  Crafted for Unforgettable Celebrations
                </h4>
                <p>
                  Every garment in our collection is curated from celebrated Indian artisans and boutique design houses. Experience luxury without the burden of permanent wardrobe storage.
                </p>
                <ul className="space-y-2 pt-2">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C52F32] flex-shrink-0" />
                    <span>Heavyweight premium authentic silk & velvet weaves</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C52F32] flex-shrink-0" />
                    <span>Intricate hand-embroidered Zardozi, Resham & gota work</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C52F32] flex-shrink-0" />
                    <span>Professional steam sanitization before every rental dispatch</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-3">
                <h4 className="font-heading font-black text-lg text-[#231F20] uppercase">
                  Textile Composition & Garment Care
                </h4>
                <p>
                  Crafted using raw silk, breathable micro-cotton lining, and artisan-spun threadwork. We manage 100% of the cleaning lifecycle.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#EBE4DC] border border-[#DFD5CD]">
                    <span className="text-[10px] uppercase font-bold text-[#595553] block">Primary Textile</span>
                    <span className="font-black text-[#231F20] text-xs">Pure Raw Silk & Velvet</span>
                  </div>
                  <div className="p-3 bg-[#EBE4DC] border border-[#DFD5CD]">
                    <span className="text-[10px] uppercase font-bold text-[#595553] block">Maintenance</span>
                    <span className="font-black text-[#231F20] text-xs">Dry Cleaned By Us</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fit' && (
              <div className="space-y-3">
                <h4 className="font-heading font-black text-lg text-[#231F20] uppercase">
                  Tailoring & Dimensions
                </h4>
                <p>
                  Garments are styled according to standard festive silhouettes with comfort margin.
                </p>
                <div className="p-4 bg-[#EBE4DC] border border-[#DFD5CD] text-xs space-y-1.5">
                  <p><strong>Standard Chest:</strong> 38 – 40 inches (Size M)</p>
                  <p><strong>Waist:</strong> Adjustable drawstring / elastic margin</p>
                  <p><strong>Length:</strong> Standard floor/knee drop</p>
                </div>
              </div>
            )}

            {activeTab === 'policy' && (
              <div className="space-y-3.5">
                <h4 className="font-heading font-black text-lg text-[#231F20] uppercase">
                  Clear, Fair Rental Transparency
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 bg-[#231F20] text-[#F4EFEA] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <p><strong>Refundable Security Deposit:</strong> Your deposit of {formatINR(item.securityDeposit)} is refunded in full upon return after routine inspection.</p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 bg-[#231F20] text-[#F4EFEA] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <p><strong>Late Fine Policy:</strong> Returning past your scheduled date incurs <strong>₹100 per day</strong> late fine per business rules.</p>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 bg-[#231F20] text-[#F4EFEA] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <p><strong>Hassle-Free Return:</strong> Simply return the outfit in its provided protective garment bag. No dry cleaning needed on your part.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Editorial Banner Card in Octo beige */}
          <div className="md:col-span-5">
            <div className="p-8 bg-[#EBE4DC] text-[#231F20] border border-[#DFD5CD] space-y-3">
              <span className="bg-[#231F20] text-[#F4EFEA] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 inline-block">
                OCTO RENTALS
              </span>
              <h5 className="font-heading font-black text-2xl uppercase text-[#231F20] leading-none">
                DRESS FOR THE MOMENT
              </h5>
              <p className="text-xs text-[#595553] leading-relaxed">
                Rent Wise makes luxury ethnic wear, bridal lehengas, and tuxedo gowns accessible without hoarding closets or overspending.
              </p>
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#231F20] pt-2">
                <span>100% Verified Quality Guarantee</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RELATED OUTFITS — Octo Grid */}
      {relatedItems.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DFD5CD]">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-1">
                RECOMMENDED
              </span>
              <h3 className="font-heading font-black text-3xl sm:text-4xl text-[#231F20] uppercase tracking-tight">
                YOU MAY ALSO LIKE
              </h3>
            </div>
            <Link
              to="/catalogue"
              className="text-xs font-bold text-[#231F20] hover:text-[#595553] flex items-center space-x-1 uppercase tracking-widest border-b border-[#231F20] pb-0.5 transition-colors"
            >
              <span>VIEW ALL</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedItems.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} item={rel} />
            ))}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <CheckoutModal
          item={item}
          startDate={startDate}
          endDate={endDate}
          quantity={quantity}
          durationDays={durationDays}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;
