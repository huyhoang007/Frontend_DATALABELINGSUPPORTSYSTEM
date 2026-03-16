import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Đang tải...',
  size = 40,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: '12px',
    }}>
      <div style={{
        width: size,
        height: size,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {message && (
        <span style={{ fontSize: '14px', color: '#6b7280' }}>{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
