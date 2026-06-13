import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
    return (
        <>
            {open && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => onOpenChange?.(false)}
                    />
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-3xl">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className = '', children, ...props }, ref) => (
        <div
            ref={ref}
            className={`relative w-full rounded-lg border border-slate-800 bg-slate-900 shadow-lg max-h-[90vh] overflow-y-auto ${className}`}
            {...props}
        >
            {children}
        </div>
    )
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
    ({ className = '', children, ...props }, ref) => (
        <div
            ref={ref}
            className={`flex flex-col space-y-1.5 p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    )
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
    ({ className = '', children, ...props }, ref) => (
        <h2
            ref={ref}
            className={`text-lg font-semibold leading-none tracking-tight ${className}`}
            {...props}
        >
            {children}
        </h2>
    )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
    ({ className = '', children, ...props }, ref) => (
        <p
            ref={ref}
            className={`text-sm text-slate-400 ${className}`}
            {...props}
        >
            {children}
        </p>
    )
);
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
