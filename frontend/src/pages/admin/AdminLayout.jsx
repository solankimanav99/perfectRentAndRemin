import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, CalendarDays, Undo2, Tags } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/inventory', icon: ShoppingBag, label: 'Inventory' },
    { to: '/admin/categories', icon: Tags, label: 'Categories' },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { to: '/admin/returns', icon: Undo2, label: 'Returns' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F4EFEA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#DFD5CD] flex flex-col hidden lg:flex shadow-sm">
        <div className="p-6 border-b border-[#DFD5CD]">
          <span className="font-heading text-2xl font-black text-[#231F20] tracking-tight uppercase block">
            RENT WISE
          </span>
          <span className="text-[10px] font-bold text-[#595553] tracking-widest uppercase">Octo Admin Console</span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-none text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#231F20] text-[#F4EFEA] border-l-4 border-[#595553]'
                    : 'text-[#231F20] hover:bg-[#F4EFEA] hover:text-black'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
