import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function LogoutButton() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide on public pages and when not authenticated
    const publicPaths = ['/login', '/register', '/unauthorized', '/dev-check'];
    if (publicPaths.includes(location.pathname) || !user) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="fixed top-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-500 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
            title="Đăng xuất"
        >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Đăng xuất</span>
        </button>
    );
}
