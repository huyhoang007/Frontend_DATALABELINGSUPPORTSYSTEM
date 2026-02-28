import * as React from "react";
import { authApi } from "../api/authApi";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

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
