import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { clothingService } from '../services/clothingService';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import ErrorMessage from '../components/ErrorMessage';
import ScrollReveal from '../components/ScrollReveal';

const Catalogue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await clothingService.getCategories();
        setCategories(cats || []);
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchClothing = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clothingService.getAllClothing(filters);
        setItems(res.items || []);
        setPagination(res.pagination || { page: 1, limit: 12, totalItems: 0, totalPages: 1 });
      } catch (err) {
        setError(err.message || 'Failed to load catalogue items.');
      } finally {
        setLoading(false);
      }
    };

    fetchClothing();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key]) params.set(key, newFilters[key]);
    });
    setSearchParams(params);
  };

  const handleReset = () => {
    const resetState = {
      search: '', category: '', size: '', color: '', minPrice: '', maxPrice: '', startDate: '', endDate: '', page: 1, limit: 12,
    };
    setFilters(resetState);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      handleFilterChange({ ...filters, page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F4EFEA] min-h-screen pt-12 pb-24 px-4 sm:px-8 max-w-[1400px] mx-auto text-[#231F20]">
      {/* Catalogue Header */}
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DFD5CD] pb-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#595553] block mb-2">
              EXPLORE THE COLLECTION
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl text-[#231F20] tracking-tight">
              CLOTHING CATALOGUE
            </h1>
            <p className="text-sm text-[#595553] mt-2 font-medium">
              Showing {pagination.totalItems || items.length} luxury rental items
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center justify-center space-x-2 py-2.5 px-4 border border-[#231F20] bg-white text-xs font-bold tracking-widest uppercase text-[#231F20]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{mobileFilterOpen ? 'Hide Filters' : 'Filter Collection'}</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Category Quick Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => handleFilterChange({ ...filters, category: '', page: 1 })}
          className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wider whitespace-nowrap transition-all ${
            !filters.category
              ? 'bg-[#231F20] text-[#F4EFEA]'
              : 'bg-white text-[#231F20] border border-[#DFD5CD] hover:border-[#231F20]'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const isSelected = filters.category === cat.name || filters.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleFilterChange({ ...filters, category: cat.name, page: 1 })}
              className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#231F20] text-[#F4EFEA]'
                  : 'bg-white text-[#231F20] border border-[#DFD5CD] hover:border-[#231F20]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Filters */}
        <div className={`lg:col-span-3 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        {/* Clothing Items Grid */}
        <div className="lg:col-span-9">
          <ProductGrid items={items} loading={loading} />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-12">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2.5 border border-[#DFD5CD] bg-white hover:border-[#231F20] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-[#231F20]" />
              </button>

              <span className="text-xs font-bold text-[#231F20] px-4 py-2 bg-white border border-[#DFD5CD]">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2.5 border border-[#DFD5CD] bg-white hover:border-[#231F20] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-[#231F20]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
