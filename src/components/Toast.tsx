import { useEffect, memo } from 'react';
import { CheckCircle, AlertCircle, X, WifiOff, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'offline';
  onClose: () => void;
  duration?: number;
}

const ToastComponent = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    offline: <WifiOff className="w-5 h-5" />
  };

  const styles = {
    success: 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200',
    error: 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200',
    info: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200',
    offline: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-lg ${styles[type]}`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="text-sm font-medium pr-4">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-white/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Toast = memo(ToastComponent);