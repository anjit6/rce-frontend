import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API client configuration
// In production (when VITE_API_URL is empty), use relative path so nginx can proxy
// In development, use localhost:8080
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8080');

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens, logging, etc.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;

      switch (status) {
        case 401:
          console.error('Unauthorized - Please login again');
          // Clear auth token and redirect to login
          localStorage.removeItem('auth_token');
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden - You do not have permission');
          break;
        case 404:
          console.error('Not Found - Resource not found');
          break;
        case 409:
          console.error('Conflict - Resource already exists');
          break;
        case 500:
          console.error('Server Error - Please try again later');
          break;
        default:
          console.error(`API Error [${status}]:`, data?.error || error.message);
      }
    } else if (error.request) {
      console.error('Network Error - No response received', error.request);
    } else {
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };
