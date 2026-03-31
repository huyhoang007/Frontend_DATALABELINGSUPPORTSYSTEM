import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface ModernRegisterFormProps {
  onRegister: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<void> | void;
  onSwitchToLogin?: () => void;
}

const ModernRegisterForm: React.FC<ModernRegisterFormProps> = ({
  onRegister,
  onSwitchToLogin,
}) => {
  const { t } = useTranslation(["auth", "common"]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("auth:register.validation.usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("auth:register.validation.usernameMin");
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = t("auth:register.validation.fullNameRequired");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("auth:register.validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("auth:register.validation.emailInvalid");
    }
    if (!formData.password) {
      newErrors.password = t("auth:register.validation.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("auth:register.validation.passwordMin");
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth:register.validation.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Backend needs: username, email, password, fullName
      await onRegister({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });
    } catch (error) {
      // Error handling is done in parent component
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,theme(colors.blue.500/0.1),transparent_50%),radial-gradient(circle_at_75%_75%,theme(colors.purple.500/0.1),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[500px] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-foreground text-2xl font-light m-0 mb-8 tracking-wide">
            {t("auth:register.title")}
          </h1>
        </div>

        {/* Register Card */}
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-10 shadow-2xl">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-foreground text-2xl font-bold m-0 tracking-wide">
              DATA LABELING SYSTEM
            </h2>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">{t("auth:register.fields.username.label")}</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder={t("auth:register.fields.username.placeholder")}
                className={`w-full px-4 py-3.5 bg-background border rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.username ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 'border-input focus:border-primary'}`}
              />
              {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">{t("auth:register.fields.fullName.label")}</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder={t("auth:register.fields.fullName.placeholder")}
                className={`w-full px-4 py-3.5 bg-background border rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.fullName ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 'border-input focus:border-primary'}`}
              />
              {errors.fullName && <div className="text-red-500 text-xs mt-1">{errors.fullName}</div>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">{t("auth:register.fields.email.label")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("auth:register.fields.email.placeholder")}
                className={`w-full px-4 py-3.5 bg-background border rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 'border-input focus:border-primary'}`}
              />
              {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-2">{t("auth:register.fields.password.label")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder={t("auth:register.fields.password.placeholder")}
                    className={`w-full px-4 py-3.5 pr-12 bg-background border rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 'border-input focus:border-primary'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
              </div>

              <div>
                <label className="block text-muted-foreground text-sm font-medium mb-2">{t("auth:register.fields.confirmPassword.label")}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder={t("auth:register.fields.confirmPassword.placeholder")}
                    className={`w-full px-4 py-3.5 pr-12 bg-background border rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 ring-red-500/10' : 'border-input focus:border-primary'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  >
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" /></svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30"
              leftIcon={isLoading ? "loading" : undefined}
            >
              {isLoading ? t("common:states.creating") : t("auth:register.submit")}
            </Button>
          </form>

          {/* Login Link */}
          {onSwitchToLogin && (
            <div className="text-center mt-6 pt-6 border-t border-border/50">
              <span className="text-muted-foreground text-sm">
                {t("auth:register.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="bg-transparent border-none text-violet-500 hover:text-violet-600 text-sm cursor-pointer underline transition-colors font-medium"
                >
                  {t("auth:register.switchToLogin")}
                </button>
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ModernRegisterForm;
