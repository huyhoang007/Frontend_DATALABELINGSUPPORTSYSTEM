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
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div
        className="rounded-full border-[3px] border-gray-200 border-t-blue-500 animate-spin"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {message && (
        <span className="text-sm text-gray-500">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
