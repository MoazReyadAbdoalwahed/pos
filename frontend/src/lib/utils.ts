import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function normalizeSku(value?: string | null) {
    return (value ?? "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .trim()
        .toUpperCase();
}