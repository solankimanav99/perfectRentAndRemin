import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Hexagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);
      if (data?.user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/catalogue');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-[#F4EFEA] text-[#231F20]">
      <div className="w-full max-w-md bg-white border border-[#DFD5CD] p-8 sm:p-10 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Hexagon className="w-8 h-8 text-[#231F20] fill-[#231F20]" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#231F20] uppercase tracking-tight">
            SIGN IN
          </h1>
          <p className="text-xs text-[#595553]">Access your curated rentals, bookings & profile</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#595553] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
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
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 text-xs bg-[#F4EFEA] border border-[#DFD5CD] text-[#231F20] focus:outline-none focus:border-[#231F20]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#595553] hover:text-[#231F20]"
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
            {loading ? 'Signing In...' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#595553]">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-bold text-[#231F20] hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
