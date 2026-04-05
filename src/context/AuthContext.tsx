import * as React from "react";
import { authApi } from "../api/authApi";

interface UserInfo {
    username: string;
    role: string;
}

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    [key: string]: unknown;
}

interface AuthContextValue {
    user: UserInfo | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<UserInfo>;
    register: (payload: RegisterPayload) => Promise<unknown>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const IDLE_TIMEOUT = 30 * 60 * 1000;
const SESSION_KEY = "sessionExpiry";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

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

    React.useEffect(() => {
        if (!user) return;

        const resetExpiry = () => {
            localStorage.setItem(SESSION_KEY, String(Date.now() + IDLE_TIMEOUT));
        };

        ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetExpiry, { passive: true }));

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

    const login = async (credentials: LoginCredentials): Promise<UserInfo> => {
        const response = await authApi.login(credentials) as { accessToken: string; username: string; role: string };
        const { accessToken, username, role } = response;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem(SESSION_KEY, String(Date.now() + IDLE_TIMEOUT));
        const userInfo: UserInfo = { username, role };
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);
        return userInfo;
    };

    const register = async (payload: RegisterPayload): Promise<unknown> => {
        return await authApi.register(payload);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem(SESSION_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
