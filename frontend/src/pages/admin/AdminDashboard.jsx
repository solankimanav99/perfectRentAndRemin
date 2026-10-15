import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Users, ShoppingBag, CheckCircle, CalendarClock, Clock, AlertCircle, IndianRupee } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 border border-[#E4E7EB] shadow-sm flex items-center space-x-4">
    <div className={`w-12 h-12 flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#666B73] mb-1">{title}</p>
      <h3 className="font-heading font-black text-2xl text-[#231F20]">{value}</h3>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminService.getDashboard();
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-black text-[#231F20] uppercase tracking-wide">
          Dashboard Overview
        </h1>
        <p className="text-sm text-[#595553] mt-1">Live metrics from Rent Wise operational management backend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={data.totalCustomers} 
          icon={Users} 
          color="bg-blue-100 text-blue-700" 
        />
        <StatCard 
          title="Total Inventory" 
          value={data.totalClothingItems} 
          icon={ShoppingBag} 
          color="bg-purple-100 text-purple-700" 
        />
        <StatCard 
          title="Available Items" 
          value={data.availableItems} 
          icon={CheckCircle} 
          color="bg-emerald-100 text-emerald-700" 
        />
        <StatCard 
          title="Active Rentals" 
          value={data.activeRentals} 
          icon={CalendarClock} 
          color="bg-[#FAF9F6] border border-[#C5A059] text-[#C5A059]" 
        />
        <StatCard 
          title="Pending Bookings" 
          value={data.pendingBookings} 
          icon={Clock} 
          color="bg-amber-100 text-amber-700" 
        />
        <StatCard 
          title="Overdue Rentals" 
          value={data.overdueRentals} 
          icon={AlertCircle} 
          color="bg-rose-100 text-rose-700" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`₹${data.monthlyRevenue?.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          color="bg-green-100 text-green-700" 
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
