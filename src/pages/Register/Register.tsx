import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModernRegisterForm from '../../components/Auth/ModernRegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SOURCE_FILES } from '../../utils/sourceMeta';

interface RegisterData {
    username: string;
    email: string;
    password: string;
    [key: string]: unknown;
}

export default function Register() {
    const navigate = useNavigate();
    const { t } = useTranslation(["auth"]);
    const { register } = useAuth();
    const { addToast } = useToast();

    const handleRegister = async (userData: RegisterData) => {
        try {
            await register(userData);
            addToast(t("auth:register.successPending"), "success");
            navigate('/login');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage = error.response?.data?.message || error.message || "";

            const errorMessages: Record<string, string> = {
                'Email already exists': t("auth:register.backendErrors.emailExists"),
                'Username already exists': t("auth:register.backendErrors.usernameExists"),
                'Role not found': t("auth:register.backendErrors.roleNotFound"),
            };

            const displayMessage = errorMessages[errorMessage] ?? errorMessage ?? t("auth:register.backendErrors.generic");
            addToast(displayMessage, "error");
        }
    };

    return (
        <div
            data-source-file={SOURCE_FILES.registerPage}
      data-source-label="section:register-page"
        >
            <ModernRegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => navigate('/login')}
            />
        </div>
    );
}
