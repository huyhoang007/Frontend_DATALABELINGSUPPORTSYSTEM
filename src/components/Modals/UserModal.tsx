import React, { useState, useEffect } from 'react';

interface User {
  id?: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User | null;
  mode: 'create' | 'edit' | 'view';
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, mode }) => {
  const [formData, setFormData] = useState<User>({
    username: '',
    email: '',
    fullName: '',
    role: '',
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: '',
        status: 'ACTIVE'
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!formData.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onSave(formData);
      setLoading(false);
      onClose();
    }, 1000);
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Thêm người dùng mới' : 
                mode === 'edit' ? 'Chỉnh sửa người dùng' : 'Thông tin người dùng';

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Tên đăng nhập *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.username ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.username}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.email ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
              placeholder="Nhập email"
            />
            {errors.email && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Họ và tên *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.fullName ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.fullName}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Vai trò *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.role ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
            >
              <option value="">Chọn vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="MANAGER">Quản lý dự án</option>
              <option value="ANNOTATOR">Người gán nhãn</option>
              <option value="REVIEWER">Người kiểm duyệt</option>
            </select>
            {errors.role && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.role}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="PENDING">Chờ duyệt</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#666',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {isReadOnly ? 'Đóng' : 'Hủy'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: loading ? '#ccc' : '#1976d2',
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
                {loading ? 'Đang xử lý...' : (mode === 'create' ? 'Thêm' : 'Cập nhật')}
              </button>
            )}
          </div>
        </form>
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

export default UserModal;