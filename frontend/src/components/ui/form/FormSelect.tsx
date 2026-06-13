import type { UseFormRegisterReturn } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface OptionItem {
    value: string;
    label: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon: LucideIcon;
    options: OptionItem[];
    registration: UseFormRegisterReturn;
    isRtl?: boolean;
}

export default function FormSelect({
    label,
    error,
    icon: Icon,
    options,
    registration,
    id,
    className = "",
    isRtl = true,
    ...props
}: FormSelectProps) {
    const hasError = !!error;
    const paddingX = isRtl ? "pr-10 pl-4" : "pl-10 pr-4";
    const iconPlacement = isRtl ? "right-3" : "left-3";

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-slate-200 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <Icon className={`absolute ${iconPlacement} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none`} aria-hidden="true" />
                <select
                    id={id}
                    {...registration}
                    {...props}
                    className={`w-full ${paddingX} py-2.5 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed
                        ${hasError
                            ? "border-red-500 focus:border-red-400"
                            : "border-white/10 focus:border-blue-500"
                        } ${className}`}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {hasError && (
                <p className="mt-1.5 flex items-center gap-1 text-red-400 text-xs" role="alert">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}