import { useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../../hooks/use-toast";
import {
    UserPlus,
    Users,
    UserX,
    Shield,
    Briefcase,
    Lock,
    User,
    AlertCircle,
    Loader2,
    RefreshCw,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import PermissionGate from "./PermissionGate";
import FormInput from "../../../components/ui/form/FormInput";
import FormSelect from "../../../components/ui/form/FormSelect";
import Button from "../../../components/ui/Button";

const EmployeeSchema = z.object({
    name: z.string().min(3, "الاسم الكامل يجب أن لا يقل عن 3 أحرف"),
    username: z
        .string()
        .min(3, "اسم المستخدم يجب أن لا يقل عن 3 أحرف")
        .regex(/^\S+$/, "اسم المستخدم لا يجب أن يحتوي على مسافات"),
    password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف"),
    role: z.enum(["manager", "cashier"], {
        message: "يرجى تحديد دور الموظف",
    }),
});

type EmployeeInput = z.infer<typeof EmployeeSchema>;

const ROLE_STYLES: Record<string, string> = {
    admin: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    manager: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    cashier: "bg-blue-500/10  border-blue-500/30  text-blue-400",
    default: "bg-slate-500/10 border-slate-500/30 text-slate-400",
};

const ROLE_LABELS: Record<string, string> = {
    admin: "مسؤول النظام",
    manager: "مدير",
    cashier: "كاشير",
    customer: "عميل",
};

function RoleBadge({ role }: { role: string }) {
    const style = ROLE_STYLES[role] ?? ROLE_STYLES.default;
    const label = ROLE_LABELS[role] ?? role;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {label}
        </span>
    );
}

export default function EmployeeManagement() {
    const {
        getAllEmployees,
        deactivateEmployee,
        registerEmployee,
        employeeList,
        loading,
        error,
    } = useAuth();

    const { toast } = useToast();
    const showSuccess = (msg: string) => toast({ title: msg });
    const showError = (msg: string) => toast({ title: msg, variant: "destructive" });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EmployeeInput>({
        mode: "onBlur",
        resolver: zodResolver(EmployeeSchema),
        defaultValues: { role: "cashier" },
    });

    const fetchEmployees = useCallback(() => {
        getAllEmployees();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const onSubmit: SubmitHandler<EmployeeInput> = async (data) => {
        const trimmedUsername = data.username.trim();
        const normalizedUsername = trimmedUsername.toLowerCase();

        // Ensure we have a fresh employee list before checking
        if (!employeeList || employeeList.length === 0) {
            await getAllEmployees();
        }

        // Prevent submitting an already-existing username (client-side guard, normalized)
        if (employeeList && employeeList.some((e: any) => (e.username || '').toLowerCase() === normalizedUsername)) {
            showError('اسم المستخدم موجود بالفعل');
            return;
        }

        const result = await registerEmployee({
            ...data,
            username: normalizedUsername,
        });

        if (result.meta?.requestStatus === "fulfilled") {
            showSuccess("تم تسجيل الموظف الجديد بنجاح!");
            reset();
            fetchEmployees();
        } else {
            const msg = typeof result.payload === "string" ? result.payload : "خطأ غير معروف";
            showError(`فشل تسجيل الموظف: ${msg}`);
        }
    };

    const handleDeactivate = async (id: string, empName: string) => {
        if (!window.confirm(`هل أنت متأكد من رغبتك في تعطيل حساب الموظف: ${empName}؟`)) return;

        const result = await deactivateEmployee(id);

        if (result.meta?.requestStatus === "fulfilled") {
            showSuccess(`تم إيقاف حساب ${empName} بنجاح`);
        } else {
            const msg = typeof result.payload === "string" ? result.payload : "حدث خطأ أثناء محاولة تعطيل الحساب";
            showError(msg);
        }
    };

    const isFormBusy = loading || isSubmitting;

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-8">

                <header className="flex items-center gap-3 border-b border-white/10 pb-5">
                    <Users className="w-8 h-8 text-blue-400" aria-hidden />
                    <div>
                        <h1 className="text-3xl font-bold text-white">لوحة إدارة الموظفين</h1>
                        <p className="text-slate-400 text-sm mt-1">إضافة ومتابعة طاقم عمل Alfagr Shop</p>
                    </div>
                </header>

                <PermissionGate allowedRoles={["admin"]}>
                    <section aria-labelledby="add-employee-heading" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <UserPlus className="w-5 h-5 text-emerald-400" aria-hidden />
                            <h2 id="add-employee-heading" className="text-lg font-semibold text-white">تسجيل موظف جديد</h2>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">

                            <FormInput
                                id="emp-name"
                                type="text"
                                placeholder="الاسم الكامل"
                                disabled={isFormBusy}
                                icon={User}
                                registration={register("name")}
                                error={errors.name?.message}
                                isRtl={true}
                            />

                            <FormInput
                                id="emp-username"
                                type="text"
                                placeholder="اسم المستخدم"
                                disabled={isFormBusy}
                                autoComplete="off"
                                icon={Briefcase}
                                registration={register("username")}
                                error={errors.username?.message}
                                isRtl={true}
                            />

                            <FormInput
                                id="emp-password"
                                type="password"
                                placeholder="كلمة المرور"
                                disabled={isFormBusy}
                                autoComplete="new-password"
                                icon={Lock}
                                registration={register("password")}
                                error={errors.password?.message}
                                isRtl={true}
                            />

                            <div className="flex gap-2 w-full">
                                <FormSelect
                                    id="emp-role"
                                    disabled={isFormBusy}
                                    icon={Shield}
                                    registration={register("role")}
                                    error={errors.role?.message}
                                    isRtl={true}
                                    options={[
                                        { value: "cashier", label: "كاشير" },
                                        { value: "manager", label: "مدير" }
                                    ]}
                                />

                                <Button
                                    type="submit"
                                    disabled={isFormBusy}
                                    variant="primary"
                                    size="lg"
                                    isLoading={isFormBusy}
                                    loadingSpinner={<Loader2 className="w-5 h-5 animate-spin" aria-label="جاري الإضافة..." />}
                                >
                                    إضافة موظف
                                </Button>
                            </div>
                        </form>
                    </section>
                </PermissionGate>

                {/* Table implementation details unchanged for brevity */}
                <PermissionGate
                    allowedRoles={["admin", "manager"]}
                    fallback={
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400" role="alert">
                            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
                            <p className="text-sm font-medium">ليس لديك صلاحية لعرض قائمة الموظفين.</p>
                        </div>
                    }
                >
                    <section aria-labelledby="employees-table-heading" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 id="employees-table-heading" className="text-lg font-semibold text-white">
                                قائمة الموظفين {employeeList?.length > 0 && <span className="mr-2 text-sm font-normal text-slate-400">({employeeList.length})</span>}
                            </h2>
                            <Button
                                onClick={fetchEmployees}
                                disabled={loading}
                                variant="text"
                                size="sm"
                                icon={RefreshCw}
                                iconPosition="left"
                            >
                                تحديث
                            </Button>
                        </div>

                        {error && (
                            <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
                                <span>فشل تحميل البيانات: {error}</span>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full text-right border-collapse" aria-label="جدول الموظفين">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-sm">
                                        <th scope="col" className="p-4 font-medium">الاسم</th>
                                        <th scope="col" className="p-4 font-medium">اسم المستخدم</th>
                                        <th scope="col" className="p-4 font-medium">الدور</th>
                                        <th scope="col" className="p-4 font-medium text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                                    {employeeList && employeeList.length > 0 ? (
                                        employeeList.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-white/2 transition">
                                                <td className="p-4 font-medium text-white">{emp.name}</td>
                                                <td className="p-4 text-slate-400">{emp.username}</td>
                                                <td className="p-4"><RoleBadge role={emp.role} /></td>
                                                <td className="p-4 text-center">
                                                    <PermissionGate allowedRoles={["admin"]} fallback={<span className="text-slate-500 text-xs bg-white/5 px-2.5 py-1 rounded">عرض فقط</span>}>
                                                        <Button
                                                            onClick={() => handleDeactivate(emp.id, emp.name ?? "الموظف")}
                                                            variant="danger"
                                                            size="sm"
                                                            icon={UserX}
                                                            iconPosition="left"
                                                        >
                                                            إيقاف الحساب
                                                        </Button>
                                                    </PermissionGate>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-10 text-slate-500">
                                                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...</span> : "لا يوجد موظفون مسجلون حالياً."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </PermissionGate>
            </div>
        </div>
    );
}