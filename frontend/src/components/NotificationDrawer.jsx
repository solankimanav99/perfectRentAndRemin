import React from 'react';
import { Bell, X, Check, Calendar, AlertTriangle, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationDrawer = () => {
  const { notifications, isOpen, setIsOpen, markRead } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 bg-[#121417] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-serif-title font-bold text-base text-white">Rental Notifications</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p>You have no notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white border-gray-200 opacity-75'
                    : 'bg-white border-[#C5A059] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium block mt-1">
                        {new Date(notif.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="p-1 text-[#C5A059] hover:bg-[#C5A059]/10 rounded-full text-[10px] font-bold flex items-center space-x-1 shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
