import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Barcode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

interface BarcodeScannerProps {
    barcodeRef: React.RefObject<HTMLInputElement | null>;
    disabled?: boolean;
    onSubmit: (barcode: string, reset: () => void) => void;
}

interface BarcodeForm {
    barcode: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ barcodeRef, disabled, onSubmit }) => {
    const { register, handleSubmit, reset, setFocus } = useForm<BarcodeForm>({
        defaultValues: { barcode: "" },
    });

    // Re-focus the barcode input when the scanner mounts or tab becomes active
    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (!disabled) {
                setFocus("barcode");
                barcodeRef.current?.focus();
            }
        }, 50);
        return () => window.clearTimeout(timer);
    }, [barcodeRef, disabled, setFocus]);

    // Wire the external ref to the RHF-registered input
    const { ref: rhfRef, ...barcodeReg } = register("barcode");

    const onValid = ({ barcode }: BarcodeForm) => {
        onSubmit(barcode.trim(), () => {
            reset();
            // Return focus to field after submit
            setFocus("barcode");
        });
    };

    return (
        <Card className="bg-[#1e293b] border-slate-800 shadow-xl">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
                    <Barcode className="w-5 h-5 text-indigo-400" />
                    قارئ الباركود
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onValid)} className="flex gap-3">
                    <Input
                        {...barcodeReg}
                        ref={(el: HTMLInputElement | null) => {
                            rhfRef(el);
                            barcodeRef.current = el;
                        }}
                        autoFocus
                        placeholder="اضرب بالسكانر أو اكتب الباركود يدوياً..."
                        className="flex-1 text-center font-mono text-lg bg-[#0f172a] border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                        disabled={disabled}
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={disabled}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6"
                    >
                        إضافة
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default BarcodeScanner;