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

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: '#f44336',
          confirmBg: '#f44336',
          icon: '⚠️'
        };
      case 'warning':
        return {
          iconColor: '#ff9800',
          confirmBg: '#ff9800',
          icon: '⚠️'
        };
      case 'info':
        return {
          iconColor: '#2196f3',
          confirmBg: '#2196f3',
          icon: 'ℹ️'
        };
      default:
        return {
          iconColor: '#f44336',
          confirmBg: '#f44336',
          icon: '⚠️'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          color: typeStyles.iconColor
        }}>
          {typeStyles.icon}
        </div>

        <h3 style={{
          margin: '0 0 16px 0',
          color: '#333',
          fontSize: '20px'
        }}>
          {title}
        </h3>

        <p style={{
          margin: '0 0 24px 0',
          color: '#666',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#666',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: loading ? '#ccc' : typeStyles.confirmBg,
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ConfirmDialog;