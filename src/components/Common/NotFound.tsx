import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '80vh', backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        maxWidth: 400, width: '100%', margin: '0 16px',
        background: '#fff', borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        padding: '40px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>

        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#172B4D', marginBottom: 8 }}>404</h1>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#44546F', marginBottom: 12 }}>
          Trang không tồn tại
        </h2>

        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Về Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px', background: '#fff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
