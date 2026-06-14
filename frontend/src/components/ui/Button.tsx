import React, { type ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button content - can be text, icon, or combination */
    children?: ReactNode;

    /** Visual variant of the button */
    variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'admin' | 'outline' | 'ghost';

    /** Button size */
    size?: 'sm' | 'md' | 'lg' | 'icon';

    /** Optional icon to display (usually from lucide-react) */
    icon?: React.ComponentType<{ className?: string }>;

    /** Icon position relative to text */
    iconPosition?: 'left' | 'right';

    /** Show loading spinner */
    isLoading?: boolean;

    /** Loading spinner component */
    loadingSpinner?: ReactNode;

    /** Support RTL layout */
    isRtl?: boolean;

    /** Full width button */
    fullWidth?: boolean;

    /** Custom className to merge with default styles */
    className?: string;
}

/**
 * Reusable Button Component
 * Handles multiple variants and states without changing business logic
 * All props are passed through to the underlying button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            icon: Icon,
            iconPosition = 'right',
            isLoading = false,
            loadingSpinner,
            isRtl = false,
            fullWidth = false,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        // Base classes - common to all buttons
        const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-medium transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

        // Size variants
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-xs rounded-lg',
            md: 'px-4 py-2.5 text-sm rounded-lg',
            lg: 'px-5 py-3 text-base rounded-lg',
            icon: 'p-2 rounded-lg',
        };

        // Color variants
        const variantClasses = {
            primary: 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg',
            secondary: 'bg-slate-700 hover:bg-slate-600 text-white shadow-md',
            danger: 'bg-red-600 hover:bg-red-800 border border-red-500/30 text-red-300 hover:text-white',
            text: 'text-slate-400 hover:text-white',
            admin: 'bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg',
            outline: 'bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-800 shadow-none',
            ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 shadow-none',
        };

        // Combine classes
        const buttonClasses = [
            baseClasses,
            sizeClasses[size],
            variantClasses[variant],
            fullWidth && 'w-full',
            variant === 'text' && 'disabled:opacity-50',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        // Determine icon positioning based on RTL
        const shouldReverseOrder = isRtl && Icon && children;
        const showIcon = Icon && !isLoading;

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={buttonClasses}
                {...props}
            >
                {shouldReverseOrder ? (
                    <>
                        {children}
                        {showIcon && (
                            <Icon className={`w-${size === 'sm' ? '3.5' : '4'} h-${size === 'sm' ? '3.5' : '4'}`} />
                        )}
                    </>
                ) : (
                    <>
                        {showIcon && iconPosition === 'left' && (
                            <Icon className={`w-${size === 'sm' ? '3.5' : '4'} h-${size === 'sm' ? '3.5' : '4'}`} />
                        )}
                        {isLoading ? loadingSpinner : children}
                        {showIcon && iconPosition === 'right' && (
                            <Icon className={`w-${size === 'sm' ? '3.5' : '4'} h-${size === 'sm' ? '3.5' : '4'}`} />
                        )}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
