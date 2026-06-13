import axios from "axios";
import { tokenManger } from "./tokenManager";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
})

console.log(axiosInstance.defaults.baseURL)


axiosInstance.interceptors.request.use(
    (config) => {
        console.log("Sending request to base URL:", config.baseURL);
        const token = tokenManger.getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config

    },
    (error) => {

        return Promise.reject(error);
    })