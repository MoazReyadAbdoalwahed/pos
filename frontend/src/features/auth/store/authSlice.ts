import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
    loginUser,
    adminLogin,
    registerEmployee,
    getAllEmployees,
    deactivateEmployee
} from './authThunks'
import { tokenManger } from '../../../api/tokenManager'
import type { User, LoginResponse, RegisterEmployeeResponse } from '../../../types/users'


interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    employees: User[];
}

const initialState: AuthState = {
    user: tokenManger.getUser(),
    token: tokenManger.getToken(),
    isAuthenticated: !!(tokenManger.getToken() && tokenManger.getUser()),
    loading: false,
    error: null,
    employees: []
}

const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
            tokenManger.clearToken()
        },
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
                state.token = action.payload.token
                state.user = action.payload.user
                state.isAuthenticated = true
                state.loading = false
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            .addCase(adminLogin.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(adminLogin.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
                state.token = action.payload.token
                state.user = action.payload.user
                state.isAuthenticated = true
                state.loading = false
            })
            .addCase(adminLogin.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            .addCase(registerEmployee.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(registerEmployee.fulfilled, (state, action: PayloadAction<RegisterEmployeeResponse>) => {
                state.loading = false
                state.error = null
                state.employees = [...state.employees, action.payload.employee]; // fully typed

            })
            .addCase(registerEmployee.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            .addCase(getAllEmployees.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getAllEmployees.fulfilled, (state, action: PayloadAction<User[]>) => {
                state.loading = false
                state.error = null
                state.employees = action.payload
            })
            .addCase(getAllEmployees.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
            .addCase(deactivateEmployee.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deactivateEmployee.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false
                state.error = null
                state.employees = state.employees.filter(emp => emp.id !== action.payload)
            })
            .addCase(deactivateEmployee.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
    }
})

export const { logout, clearError } = AuthSlice.actions
export default AuthSlice.reducer