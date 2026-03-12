import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface ModernLoginFormProps {
  onLogin: (username: string, password: string) => void;
  onSwitchToRegister?: () => void;
}

const ModernLoginForm: React.FC<ModernLoginFormProps> = ({
  onLogin,
  onSwitchToRegister,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onLogin(username, password);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,theme(colors.blue.500/0.1),transparent_50%),radial-gradient(circle_at_75%_75%,theme(colors.purple.500/0.1),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-foreground text-2xl font-light m-0 mb-8 tracking-wide">
            Màn hình đăng nhập
          </h1>
        </div>

        {/* Login Card */}
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-10 shadow-2xl">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-[80px] h-[80px] flex items-center justify-center mx-auto mb-5">
              <img src="/logo.svg" alt="DataLabeling Logo" className="w-full h-full" />
            </div>
            <h2 className="text-foreground text-2xl font-bold m-0 tracking-wide">
              DATA LABELING SYSTEM
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                className="w-full px-4 py-3.5 bg-background border border-input rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-muted-foreground text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full px-4 py-3.5 pr-12 bg-background border border-input rounded-lg text-foreground text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer p-1"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center mb-8">
              <label className="flex items-center text-muted-foreground text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 accent-primary"
                />
                Ghi nhớ đăng nhập
              </label>
              <button
                type="button"
                className="bg-transparent border-none text-blue-500 hover:text-blue-600 text-sm cursor-pointer transition-colors font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
              leftIcon={isLoading ? "loading" : undefined}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          {/* Register Link */}
          {onSwitchToRegister && (
            <div className="text-center mt-6 pt-6 border-t border-border/50">
              <span className="text-muted-foreground text-sm">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="bg-transparent border-none text-blue-500 hover:text-blue-600 text-sm cursor-pointer underline transition-colors font-medium"
                >
                  Đăng ký ngay
                </button>
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ModernLoginForm;
