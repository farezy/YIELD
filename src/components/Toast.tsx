import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white dark:bg-[#1A1A1E] border-emerald-500/40 text-gray-900 dark:text-white',
    error: 'bg-white dark:bg-[#1A1A1E] border-red-500/40 text-gray-900 dark:text-white',
    info: 'bg-white dark:bg-[#1A1A1E] border-blue-500/40 text-gray-900 dark:text-white',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 ${
        bgStyles[toast.type]
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <p className="text-xs font-semibold leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
