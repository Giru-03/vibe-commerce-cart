import React, { useState, useCallback } from 'react';
import { NotificationContext } from './NotificationContext.jsx';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const notifConfig = {
  error: {
    icon: FiAlertCircle,
    bgClass: 'bg-gradient-to-r from-red-500 to-red-600',
    borderClass: 'border-red-400',
  },
  success: {
    icon: FiCheckCircle,
    bgClass: 'bg-gradient-to-r from-green-500 to-emerald-600',
    borderClass: 'border-green-400',
  },
  info: {
    icon: FiInfo,
    bgClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
    borderClass: 'border-blue-400',
  }
};

export function NotificationProvider({ children }) {
  const [notifs, setNotifs] = useState([]);

  const notify = useCallback((message, type = 'info', timeout = 4000) => {
    const id = Date.now() + Math.random();
    setNotifs((s) => [...s, { id, message, type }]);
    setTimeout(() => setNotifs((s) => s.filter((n) => n.id !== id)), timeout);
    return id;
  }, []);

  const remove = useCallback((id) => setNotifs((s) => s.filter((n) => n.id !== id)), []);

  return (
    <NotificationContext.Provider value={{ notify, remove }}>
      {children}

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 max-w-md">
        {notifs.map((n) => {
          const config = notifConfig[n.type] || notifConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={n.id}
              role="status"
              className={`w-full px-5 py-4 rounded-2xl shadow-2xl text-white flex items-center gap-3 ${config.bgClass} backdrop-blur-sm animate-slide-in-right transform transition-all duration-300 hover:scale-105`}
            >
              <div className="shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-5 h-5" />
              </div>
              <span className="grow font-medium">{n.message}</span>
              <button 
                onClick={() => remove(n.id)} 
                className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close notification"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx="true">{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;