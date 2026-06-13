export interface User {
    id: string;
    _id?: string; // هذا الحقل اختياري لأنه قد يأتي من الـ backend باسم _id أو id
    name: string;
    username: string;
    role: 'admin' | 'manager' | 'cashier' | 'customer';
}

export interface LoginResponse {
    user: User;
    token: string
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface EmployeeLogin {
    name: string;
    username: string;
    password: string;
    role: 'admin' | 'manager' | 'cashier' | 'customer';
}

export interface RegisterEmployeeResponse {
    message: string;
    employee: User; // تم إضافة هذا الحقل ليتوافق مع البيانات التي نحتاجها في الـ Slice
}

export interface GetAllEmployeesResponse {
    status: string;
    employees: User[]
}
