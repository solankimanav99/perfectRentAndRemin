import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  Hexagon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, setIsOpen: setNotifOpen } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'SHOP ALL', path: '/catalogue' },
    { name: 'HOW IT WORKS', path: '/how-it-works' },
    ...(isAuthenticated ? [{ name: 'MY RENTALS', path: '/my-rentals' }] : []),
    ...(isAuthenticated && user?.role === 'ADMIN' ? [{ name: 'ADMIN PANEL', path: '/admin/dashboard' }] : []),
  ];

  return (
    <header className={`sticky top-0 z-40 w-full bg-[#F4EFEA] border-b border-[#DFD5CD] transition-all duration-300 ${scrolled ? 'header-scrolled shadow-sm' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#231F20] hover:text-black focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo (Left-aligned) — Octo Style */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Hexagon className="w-6 h-6 text-[#231F20] fill-[#231F20] group-hover:rotate-12 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="font-heading font-black text-2xl text-[#231F20] tracking-tight leading-none">
                RENT WISE
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#595553] mt-0.5">
                OCTO CLOTHING STORE
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (In-flow) */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-7">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-bold tracking-[0.12em] transition-colors relative py-1.5 ${
                    active ? 'text-[#231F20]' : 'text-[#595553] hover:text-[#231F20]'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#231F20] animate-fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <Search className="w-3.5 h-3.5 text-[#595553] absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 xl:w-48 pl-8 pr-3 py-1.5 text-xs bg-transparent border-b border-[#231F20] text-[#231F20] placeholder-[#595553] focus:outline-none focus:w-56 transition-all font-sans"
              />
            </form>

            {/* Notification Icon */}
            {isAuthenticated && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 text-[#231F20] hover:text-black hover:bg-[#EBE4DC] rounded-full transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#231F20] rounded-full ring-2 ring-[#F4EFEA]" />
                )}
              </button>
            )}

            {/* My Rentals Bag Icon */}
            <Link
              to={isAuthenticated ? "/my-rentals" : "/login"}
              className="p-2 text-[#231F20] hover:text-black hover:bg-[#EBE4DC] rounded-full transition-colors relative"
              title="My Rentals"
              aria-label="My Rentals"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>

            {/* User Account / Profile */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 py-1.5 px-3 bg-white border border-[#DFD5CD] rounded-none hover:border-[#231F20] transition-all text-xs font-bold text-[#231F20]"
                  title="My Profile"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{user?.name?.split(' ')[0] || 'Account'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-[#595553] hover:text-red-700 hover:bg-[#EBE4DC] rounded-full transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-bold tracking-widest uppercase text-[#231F20] hover:underline"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex octo-btn text-xs py-2 px-4"
                >
                  JOIN
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DFD5CD] bg-[#F4EFEA] px-6 py-6 space-y-4 shadow-xl animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="pb-3 border-b border-[#DFD5CD]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#595553] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search outfits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DFD5CD] text-[#231F20] focus:outline-none focus:border-[#231F20]"
              />
            </div>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold tracking-wider uppercase text-[#231F20] hover:translate-x-2 transition-transform"
            >
              {link.name}
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="pt-4 border-t border-[#DFD5CD] space-y-3">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#231F20]"
              >
                My Profile ({user?.name})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-sm font-bold text-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-[#DFD5CD] flex items-center space-x-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-[#231F20] border border-[#231F20]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-[#F4EFEA] bg-[#231F20]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
