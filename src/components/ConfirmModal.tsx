import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors animate-scaleUp">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            }`}
          >
            {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
              isDestructive
                ? 'bg-[#E53935] hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
