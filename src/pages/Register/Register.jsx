import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModernRegisterForm from '../../components/Auth/ModernRegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { addToast } = useToast();

    const handleRegister = async (userData) => {
        try {
            // Backend expects: { username, email, password }
            // Backend auto-assigns: role = ANNOTATOR, status = ACTIVE (default)
            
            console.log('[Register] Form data received:', userData);

            await register(userData);

            addToast("Đăng ký thành công! Vui lòng chờ quản trị viên duyệt tài khoản.", "success");
            navigate('/login');
        } catch (error) {
            console.error('[Register] Error:', error);
            const errorMessage = error.response?.data?.message || error.message || "";
            
            // Map backend errors to Vietnamese
            const errorMessages = {
                'Email already exists': 'Email đã tồn tại trong hệ thống',
                'Username already exists': 'Tên đăng nhập đã tồn tại',
                'Role not found': 'Không tìm thấy role',
            };
            
            const displayMessage = errorMessages[errorMessage] || errorMessage || "Đăng ký thất bại. Vui lòng thử lại.";
            addToast(displayMessage, "error");
        }
    };

    const handleSwitchToLogin = () => {
        navigate('/login');
    };

    return (
        <ModernRegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
        />
    );
}
