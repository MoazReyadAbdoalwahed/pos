import type { UseFormRegisterReturn } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon: LucideIcon;
    registration: UseFormRegisterReturn;
    isRtl?: boolean;
    variant?: "default" | "admin";
}

export default function FormInput({
    label,
    error,
    icon: Icon,
    registration,
    id,
    className = "",
    isRtl = true,
    variant = "default",
    ...props
}: FormInputProps) {
    const hasError = !!error;

    // Base layout configurations accounting for text direction rules
    const paddingX = isRtl ? "pr-10 pl-4" : "pl-10 pr-4";
    const iconPlacement = isRtl ? "right-3" : "left-3";

    // Dynamic state styles
    const borderVariantClass = variant === "admin"
        ? "border-amber-500/30 focus:border-amber-400 focus:ring-amber-400/20"
        : "border-white/10 focus:border-blue-500 focus:ring-blue-500/20";

    const statusClasses = hasError
        ? "border-red-500 focus:border-red-400 focus:ring-red-400/20"
        : `border border-white/20 bg-white/5 ${borderVariantClass}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-200 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <Icon
                    className={`absolute ${iconPlacement} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none`}
                    aria-hidden="true"
                />
                <input
                    id={id}
                    {...registration}
                    {...props}
                    className={`w-full ${paddingX} py-2.5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${statusClasses} ${className}`}
                />
            </div>
            {hasError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-red-400 text-xs" role="alert">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}