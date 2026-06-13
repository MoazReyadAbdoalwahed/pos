import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';

        const variantStyles = {
            default: 'border border-slate-200 bg-slate-100 text-slate-900',
            secondary: 'border border-slate-700 bg-slate-800 text-slate-100',
            destructive: 'border border-red-500/20 bg-red-500/10 text-red-400',
            outline: 'border border-slate-700 bg-transparent text-slate-400'
        };

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${className}`}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
