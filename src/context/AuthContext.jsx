import * as React from "react";
import { authApi } from "../api/authApi";

const AuthContext = React.createContext(null);

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 phút không thao tác
const SESSION_KEY = "sessionExpiry";

// Các sự kiện được coi là "đang thao tác"
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    // Khởi tạo: kiểm tra session còn hạn không
    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");
        const expiry = localStorage.getItem(SESSION_KEY);

        if (storedUser && storedToken && expiry && Date.now() < Number(expiry)) {
            setUser(JSON.parse(storedUser));
        } else if (storedUser || storedToken) {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem(SESSION_KEY);
        }
        setIsLoading(false);
    }, []);

    // Idle timeout: reset expiry mỗi khi user thao tác
    React.useEffect(() => {
        if (!user) return;

        const resetExpiry = () => {
            localStorage.setItem(SESSION_KEY, String(Date.now() + IDLE_TIMEOUT));
        };

        // Gắn listeners cho tất cả activity events
        ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetExpiry, { passive: true }));

        // Kiểm tra mỗi 30 giây xem session có hết hạn chưa
        const interval = setInterval(() => {
            const expiry = localStorage.getItem(SESSION_KEY);
            if (!expiry || Date.now() >= Number(expiry)) {
                ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetExpiry));
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("token");
                localStorage.removeItem(SESSION_KEY);
                setUser(null);
                window.location.href = "/login";
            }
        }, 30 * 1000);

        return () => {
            ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetExpiry));
            clearInterval(interval);
        };
    }, [user]);

    const login = async (credentials) => {
        try {
            const response = await authApi.login(credentials);
            const { accessToken, username, role } = response;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem(SESSION_KEY, String(Date.now() + IDLE_TIMEOUT));

            const userInfo = { username, role };
            localStorage.setItem("user", JSON.stringify(userInfo));
            setUser(userInfo);

            return userInfo;
        } catch (error) {
            throw error;
        }
    };

    const register = async (payload) => {
        try {
            return await authApi.register(payload);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem(SESSION_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
