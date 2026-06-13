import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTelegram } from "../hook/useTelegram";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface CampaignFormValues {
    message: string;
}

export interface CampaignResult {
    id: string;
    message: string;
    imageUrl?: string;
    sentAt: string;
    total: number;
    sent: number;
    failed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useMarketingCampaign() {
    const { broadcast, broadcastWithFile, loading, lastBroadcastResult, errors } = useTelegram();

    // RHF
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors: formErrors, isValid, isDirty },
    } = useForm<CampaignFormValues>({
        mode: "onChange",
        defaultValues: { message: "" },
    });

    const messageValue = watch("message");
    const charCount = messageValue?.length ?? 0;

    // Image state (controlled outside RHF since it's a File)
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Session history (in-memory only)
    const [history, setHistory] = useState<CampaignResult[]>([]);

    const handleImageSelect = useCallback((file: File | null) => {
        if (!file) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) handleImageSelect(file);
        },
        [handleImageSelect]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const clearImage = useCallback(() => {
        handleImageSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [handleImageSelect]);

    const onSubmit = useCallback(
        async (data: CampaignFormValues) => {
            let result;

            if (imageFile) {
                result = await broadcastWithFile(data.message, imageFile);
            } else {
                result = await broadcast(data.message);
            }

            // @ts-expect-error - unwrap RTK action payload
            const payload = result?.payload;
            if (payload?.success && payload?.results) {
                const entry: CampaignResult = {
                    id: `camp-${Date.now()}`,
                    message: data.message,
                    imageUrl: imagePreview ?? undefined,
                    sentAt: new Date().toLocaleTimeString("ar-EG"),
                    total: payload.results.total,
                    sent: payload.results.sent,
                    failed: payload.results.failed,
                };
                setHistory((prev) => [entry, ...prev]);
                reset();
                clearImage();
            }
        },
        [imageFile, imagePreview, broadcast, broadcastWithFile, reset, clearImage]
    );

    return {
        // form
        register,
        handleSubmit: handleSubmit(onSubmit),
        formErrors,
        isValid,
        isDirty,
        charCount,
        // image
        imageFile,
        imagePreview,
        fileInputRef,
        handleImageSelect,
        handleDrop,
        handleDragOver,
        clearImage,
        // telegram
        isSending: loading.bulkBroadcast,
        broadcastError: errors.bulkBroadcast,
        lastResult: lastBroadcastResult,
        // history
        history,
    };
}