import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModernRegisterForm from '../../components/Auth/ModernRegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Register() {
    const navigate = useNavigate();
    const { t } = useTranslation(["auth"]);
    const { register } = useAuth();
    const { addToast } = useToast();

    const handleRegister = async (userData) => {
        try {
            // Backend expects: { username, email, password }
            // Backend auto-assigns: role = ANNOTATOR, status = ACTIVE (default)
            
            console.log('[Register] Form data received:', userData);

            await register(userData);

            addToast(t("auth:register.successPending"), "success");
            navigate('/login');
        } catch (error) {
            console.error('[Register] Error:', error);
            const errorMessage = error.response?.data?.message || error.message || "";
            
            // Map backend errors to Vietnamese
            const errorMessages = {
                'Email already exists': t("auth:register.backendErrors.emailExists"),
                'Username already exists': t("auth:register.backendErrors.usernameExists"),
                'Role not found': t("auth:register.backendErrors.roleNotFound"),
            };
            
            const displayMessage = errorMessages[errorMessage] || errorMessage || t("auth:register.backendErrors.generic");
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
