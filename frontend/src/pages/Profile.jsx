import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, CheckCircle2, LogOut, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateProfile({ name, phone });
      setSuccessMsg('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F4EFEA] min-h-screen py-12 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 text-[#231F20]">
      {/* Profile Header */}
      <div className="bg-white border border-[#DFD5CD] p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[#231F20] text-[#F4EFEA] font-heading font-black text-2xl flex items-center justify-center shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#595553] block mb-1">
              AUTHENTICATED CUSTOMER
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#231F20] uppercase tracking-tight">{user?.name}</h1>
            <span className="text-xs text-[#595553] font-medium">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 border border-red-200 hover:bg-red-50 transition-colors flex items-center space-x-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-white border border-[#DFD5CD] text-[#231F20] text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#231F20] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Account Info Form */}
      <div className="bg-white border border-[#DFD5CD] p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#DFD5CD] pb-4">
          <h3 className="font-heading font-black text-lg uppercase tracking-wider text-[#231F20]">Account Information</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[#231F20] hover:underline flex items-center space-x-1 uppercase tracking-wider"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </button>
          )}
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
                Full Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4EFEA] border border-[#DFD5CD] focus:outline-none focus:border-[#231F20] text-[#231F20] disabled:opacity-75"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
                Phone Number
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4EFEA] border border-[#DFD5CD] focus:outline-none focus:border-[#231F20] text-[#231F20] disabled:opacity-75"
              />
            </div>

            {/* Email (Read Only per backend contract) */}
            <div className="space-y-1">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4EFEA]/60 border border-[#DFD5CD] text-[#595553] cursor-not-allowed"
              />
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#231F20] block">
                Account Role
              </label>
              <input
                type="text"
                disabled
                value={user?.role || 'CUSTOMER'}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4EFEA]/60 border border-[#DFD5CD] text-[#595553] font-bold cursor-not-allowed uppercase"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="octo-btn px-6 py-3 text-xs"
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setPhone(user?.phone || '');
                }}
                className="octo-btn-outline px-4 py-3 text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
