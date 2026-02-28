import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    // Form state
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        if (!username || !password) {
            addToast("Please enter username and password", "error");
            return;
        }

        setIsLoading(true);

        try {
            // Call backend API
            const user = await login({ username, password });

            addToast(`Welcome back, ${user.username}!`, "success");

            // Redirect based on role
            const roleRoutes = {
                ANNOTATOR: "/annotator/tasks",
                REVIEWER: "/reviewer/queue",
                MANAGER: "/manager/dashboard",
                ADMIN: "/admin/dashboard",
            };

            navigate(roleRoutes[user.role] || "/");
        } catch (error) {
            // Error already standardized by apiClient
            addToast(error.message || "Login failed. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background selection:bg-primary/30">

            <Card className="w-full max-w-sm p-8 shadow-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/60 hover:border-primary/30 transition-all duration-500">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">DataLabel<span className="text-primary">Core</span></h1>
                    <p className="text-muted-foreground text-sm font-medium">Internal Data Labeling System</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground pl-1">Username</label>
                            <Input
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-transparent font-mono text-sm"
                                autoComplete="username"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground pl-1">Password</label>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-transparent font-mono text-sm"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-2 h-11 text-sm font-semibold tracking-wide"
                        isLoading={isLoading}
                        variant="primary"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline underline-offset-4"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="mt-8 text-center border-t border-border pt-6">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-40">
                        Restricted Access • Internal Only
                    </p>
                </div>
            </Card>
        </div>
    );
}
