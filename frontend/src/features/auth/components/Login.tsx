import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../../../components/ui/form/FormInput";
import Button from "../../../components/ui/Button";

const LoginSchema = z.object({
    username: z.string().min(2, "Username is required"),
    password: z.string().min(6, "Password is required"),
});

type LoginInput = z.infer<typeof LoginSchema>;
type LoginMode = "staff" | "admin";

export default function Login() {
    const { loginUser, adminLogin, isAuthenticated, userRole, error, loading } = useAuth();
    const navigate = useNavigate();
    const [loginMode, setLoginMode] = useState<LoginMode>("staff");

    const {
        register,
        handleSubmit,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm<LoginInput>({
        mode: "onBlur",
        resolver: zodResolver(LoginSchema),
    });

    useEffect(() => {
        if (isAuthenticated) {
            toast.success("Login successful!");
            switch (userRole) {
                case "admin": navigate("/admin/dashboard"); break;
                case "manager": navigate("/manager/dashboard"); break;
                case "cashier": navigate("/cashier/dashboard"); break;
                default: navigate("/");
            }
        }
        if (error) {
            toast.error(error);
        }
    }, [isAuthenticated, userRole, error, navigate]);

    const switchMode = (next: LoginMode) => {
        if (loading) return;
        setLoginMode(next);
        clearErrors();
        reset();
    };

    const onSubmit: SubmitHandler<LoginInput> = (data) => {
        const formattedData = {
            ...data,
            username: data.username.trim()
        };

        if (loginMode === "staff") {
            loginUser(formattedData);
        } else {
            adminLogin(formattedData);
        }
    };

    const isAdmin = loginMode === "admin";

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">

                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">Akram Shop</h1>
                        <p className="text-slate-300 text-sm">POS System</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex rounded-lg overflow-hidden border border-white/20 mb-6">
                        <Button
                            type="button"
                            disabled={loading}
                            onClick={() => switchMode("staff")}
                            variant={!isAdmin ? "primary" : "text"}
                            size="md"
                            icon={UserIcon}
                            iconPosition="left"
                            className="flex-1"
                        >
                            Staff Login
                        </Button>
                        <Button
                            type="button"
                            disabled={loading}
                            onClick={() => switchMode("admin")}
                            variant={isAdmin ? "admin" : "text"}
                            size="md"
                            icon={ShieldCheck}
                            iconPosition="left"
                            className="flex-1"
                        >
                            Admin Login
                        </Button>
                    </div>

                    {isAdmin && (
                        <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-amber-300 text-xs">Remote admin access using server credentials.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <FormInput
                            id="username"
                            type="text"
                            label="Username"
                            placeholder="Enter your username"
                            autoComplete="username"
                            disabled={loading}
                            icon={UserIcon}
                            registration={register("username")}
                            error={errors.username?.message}
                            isRtl={false}
                            variant={isAdmin ? "admin" : "default"}
                        />

                        <FormInput
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                            icon={Lock}
                            registration={register("password")}
                            error={errors.password?.message}
                            isRtl={false}
                            variant={isAdmin ? "admin" : "default"}
                        />

                        <Button
                            type="submit"
                            disabled={loading}
                            variant={isAdmin ? "admin" : "primary"}
                            size="lg"
                            fullWidth
                            className="mt-6 transform hover:scale-105 active:scale-95 disabled:scale-100"
                        >
                            {loading ? "Logging in..." : isAdmin ? "Admin Login" : "Login"}
                        </Button>
                    </form>
                </div>
                <p className="text-center text-slate-400 text-xs mt-4">Offline-safe authentication. No public registration.</p>
            </div>
        </div>
    );
}