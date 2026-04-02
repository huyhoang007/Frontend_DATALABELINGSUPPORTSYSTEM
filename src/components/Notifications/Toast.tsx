import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const typeConfig = {
  success: { bg: 'bg-green-500', icon: 'OK' },
  error:   { bg: 'bg-red-500',   icon: 'X' },
  warning: { bg: 'bg-orange-500', icon: '!' },
  info:    { bg: 'bg-blue-500',  icon: 'i' },
};

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { bg, icon } = typeConfig[type] ?? typeConfig.info;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed right-5 top-5 z-[1200] flex min-w-[300px] max-w-[500px] items-center gap-3 rounded-lg px-5 py-4 text-white shadow-xl transition-all duration-300 ${bg} ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-base">{message}</span>
      <button
        onClick={handleClose}
        className="bg-transparent border-none text-white text-xl cursor-pointer p-0 opacity-80 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
};

// Toast Manager Component
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastManagerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, removeToast }) => {
  return (
    <div>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="fixed right-5 z-[1200]"
          style={{ top: `${20 + index * 80}px` }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
