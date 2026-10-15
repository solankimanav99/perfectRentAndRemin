import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { RefreshCw, UserCheck } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await adminService.getCustomers();
      setCustomers(result.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading && customers.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif-title text-3xl font-extrabold text-[#1C1E21]">Customers</h1>
        <button onClick={fetchCustomers} className="p-2 border rounded hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <span>{c.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{c.email}</td>
                <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomers;
