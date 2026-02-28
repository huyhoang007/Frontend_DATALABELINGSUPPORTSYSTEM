import React, { useState, useEffect } from 'react';

interface Project {
  id?: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  assignedUsers: string[];
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null;
  mode: 'create' | 'edit' | 'view';
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project, mode }) => {
  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    deadline: '',
    assignedUsers: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const availableUsers = [
    { id: '1', name: 'Nguyễn Văn A', role: 'ANNOTATOR' },
    { id: '2', name: 'Trần Thị B', role: 'ANNOTATOR' },
    { id: '3', name: 'Lê Văn C', role: 'REVIEWER' },
    { id: '4', name: 'Phạm Thị D', role: 'REVIEWER' }
  ];

  useEffect(() => {
    if (project) {
      setFormData(project);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        deadline: '',
        assignedUsers: []
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên dự án là bắt buộc';
    } else if (formData.name.length < 5) {
      newErrors.name = 'Tên dự án phải có ít nhất 5 ký tự';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả dự án là bắt buộc';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline là bắt buộc';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline không thể là ngày trong quá khứ';
      }
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
    }, 1500);
  };

  const handleInputChange = (field: keyof Project, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleUserToggle = (userId: string) => {
    const newAssignedUsers = formData.assignedUsers.includes(userId)
      ? formData.assignedUsers.filter(id => id !== userId)
      : [...formData.assignedUsers, userId];
    
    handleInputChange('assignedUsers', newAssignedUsers);
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'Tạo dự án mới' : 
                mode === 'edit' ? 'Chỉnh sửa dự án' : 'Thông tin dự án';

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
        maxWidth: '600px',
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
              Tên dự án *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.name ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
              placeholder="Nhập tên dự án"
            />
            {errors.name && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Mô tả dự án *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isReadOnly}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.description ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white',
                resize: 'vertical'
              }}
              placeholder="Nhập mô tả chi tiết về dự án"
            />
            {errors.description && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.description}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
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
                <option value="PENDING">Chờ bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Độ ưu tiên
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
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
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Deadline *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              disabled={isReadOnly}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.deadline ? '#f44336' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
              }}
            />
            {errors.deadline && (
              <span style={{ color: '#f44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.deadline}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>
              Phân công người dùng
            </label>
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '12px',
              backgroundColor: isReadOnly ? '#f5f5f5' : 'white'
            }}>
              {availableUsers.map(user => (
                <div key={user.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: formData.assignedUsers.includes(user.id) ? '#e3f2fd' : 'transparent',
                  borderRadius: '4px'
                }}>
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={formData.assignedUsers.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    disabled={isReadOnly}
                    style={{ marginRight: '12px' }}
                  />
                  <label htmlFor={`user-${user.id}`} style={{ 
                    flex: 1, 
                    cursor: isReadOnly ? 'default' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{user.name}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      backgroundColor: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {user.role}
                    </span>
                  </label>
                </div>
              ))}
              {formData.assignedUsers.length === 0 && (
                <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
                  Chưa có người dùng nào được phân công
                </p>
              )}
            </div>
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
                {loading ? 'Đang xử lý...' : (mode === 'create' ? 'Tạo dự án' : 'Cập nhật')}
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

export default ProjectModal;