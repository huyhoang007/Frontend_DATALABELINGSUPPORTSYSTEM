import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const typeConfig = {
  danger:  { iconColor: 'text-red-500',    confirmBtn: 'bg-red-500 hover:bg-red-600',    icon: '!' },
  warning: { iconColor: 'text-orange-500', confirmBtn: 'bg-orange-500 hover:bg-orange-600', icon: '!' },
  info:    { iconColor: 'text-blue-500',   confirmBtn: 'bg-blue-500 hover:bg-blue-600',  icon: 'i' },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Xác nhận', cancelText = 'Hủy',
  type = 'danger', loading = false,
}) => {
  if (!isOpen) return null;

  const { iconColor, confirmBtn, icon } = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1100]">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-sm text-center">
        <div className={`text-5xl mb-4 ${iconColor}`}>{icon}</div>
        <h3 className="m-0 mb-4 text-gray-800 text-xl font-semibold">{title}</h3>
        <p className="m-0 mb-6 text-gray-500 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded bg-white text-gray-500 cursor-pointer text-base disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-3 border-none rounded text-white text-base flex items-center gap-2 transition-colors
              ${loading ? 'bg-gray-300 cursor-not-allowed' : `${confirmBtn} cursor-pointer`}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
