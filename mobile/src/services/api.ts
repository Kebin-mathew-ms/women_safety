import axios from 'axios';
import { Platform } from 'react-native';
import SecureStorageService from './secureStore';

// Dynamic base URL configuration:
// - Web browser: uses the browser host dynamically (localhost or current IP)
// - Native App: uses the current PC local Wi-Fi IP address
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:5000/api`;
  }
  return 'http://192.168.1.5:5000/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
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
