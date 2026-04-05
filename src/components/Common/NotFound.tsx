import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-100">
      <div className="max-w-sm w-full mx-4 bg-white rounded-xl shadow-lg p-10 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-5xl font-bold text-[#172B4D] mb-2">404</h1>
        <h2 className="text-lg font-semibold text-[#44546F] mb-3">Trang không tồn tại</h2>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Về Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
