import axios from 'axios';
import SecureStorageService from './secureStore';

// Physical device on same Wi-Fi network → use PC's local IP
const DEFAULT_API_URL = 'http://192.168.1.15:5000/api';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup API URL dynamically if required in future environments
export const setBaseUrl = (url: string) => {
  apiClient.defaults.baseURL = url;
};

// Request Interceptor: Automatically append Bearer Token from secure storage
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStorageService.getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Capture unauthorized codes
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired / invalid token
      await SecureStorageService.clearAll();
      // Handle navigation redirect in screens if necessary
    }
    return Promise.reject(error);
  }
);

export default apiClient;
