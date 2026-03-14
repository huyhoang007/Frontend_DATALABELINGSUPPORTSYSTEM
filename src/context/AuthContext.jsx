import * as React from "react";
import { authApi } from "../api/authApi";

const AuthContext = React.createContext(null);

const SESSION_DURATION = 60 * 1000; // 1 phút (ms)
const SESSION_KEY = "sessionExpiry";

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");
        const expiry = localStorage.getItem(SESSION_KEY);

        if (storedUser && storedToken && expiry && Date.now() < Number(expiry)) {
            setUser(JSON.parse(storedUser));
        } else if (storedUser || storedToken) {
            // Session expired or missing expiry — clear everything
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem(SESSION_KEY);
        }
        setIsLoading(false);
    }, []);

    // Session timeout checker
    React.useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            const expiry = localStorage.getItem(SESSION_KEY);
            if (!expiry || Date.now() >= Number(expiry)) {
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("token");
                localStorage.removeItem(SESSION_KEY);
                setUser(null);
                window.location.href = "/login";
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [user]);

    /**
     * Login with username and password
     * Backend will check account status (PENDING/BANNED/ACTIVE)
     * @param {Object} credentials - { username, password }
     */
    const login = async (credentials) => {
        try {
            const response = await authApi.login(credentials);
            const { accessToken, username, role } = response;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DURATION));

            const userInfo = { username, role };
            localStorage.setItem("user", JSON.stringify(userInfo));
            setUser(userInfo);

            return userInfo;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Register new user
     * Backend auto-assigns role ANNOTATOR
     * @param {Object} payload - { username, email, password }
     */
    const register = async (payload) => {
        try {
            const response = await authApi.register(payload);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token"); // Clear legacy token if exists
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
