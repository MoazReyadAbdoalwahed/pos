export const tokenManger = {

    getToken: (): string | null => localStorage.getItem('token'),

    setToken: (token: string): void => localStorage.setItem('token', token),

    clearToken: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser: (): any | null => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setUser: (user: any): void => localStorage.setItem('user', JSON.stringify(user))
} 