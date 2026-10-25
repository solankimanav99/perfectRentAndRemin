import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Hexagon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage';

const AdminLogin = () => {
  const { adminLogin, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated as an Admin, redirect to Admin Dashboard
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await adminLogin(formData.email, formData.password);
      if (data?.user?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Access denied. Administrator privileges required.');
      }
    } catch (err) {
      setError(err.message || 'Administrator authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F4EFEA] text-[#231F20]">
      <div className="w-full max-w-md bg-white border border-[#DFD5CD] p-8 sm:p-10 shadow-sm space-y-6">
        {/* Header with Security Badge */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Hexagon className="w-8 h-8 text-[#231F20] fill-[#231F20]" />
          </div>
          <div className="inline-block px-2.5 py-0.5 bg-[#231F20] text-[#F4EFEA] text-[10px] font-black uppercase tracking-widest rounded-none">
            Admin Console
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#231F20] uppercase tracking-tight">
            ADMIN SIGN IN
          </h1>
          <p className="text-xs text-[#595553]">
            Restricted portal for inventory, bookings & store management
          </p>
        </div>

        {/* Notice for currently logged-in customer */}
        {isAuthenticated && user?.role !== 'ADMIN' && (
          <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Signed in as {user.name || user.email} (Customer)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Administrator credentials are required to access this portal. Sign in below with an admin account to proceed.
              </p>
            </div>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#595553] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@perfectrent.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 text-xs bg-[#F4EFEA] border border-[#DFD5CD] text-[#231F20] focus:outline-none focus:border-[#231F20]"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#595553] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 text-xs bg-[#F4EFEA] border border-[#DFD5CD] text-[#231F20] focus:outline-none focus:border-[#231F20]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#595553] hover:text-[#231F20]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="octo-btn w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? 'Authenticating Admin...' : 'SIGN IN TO CONSOLE'}
          </button>
        </form>

        <div className="border-t border-[#DFD5CD] pt-4 flex flex-col items-center gap-2 text-xs text-[#595553]">
          <Link
            to="/login"
            className="font-bold text-[#231F20] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Sign In
          </Link>
          <Link to="/" className="text-[11px] text-[#595553] hover:underline">
            Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
