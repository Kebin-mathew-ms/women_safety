import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token_safe_travel';
const USER_KEY = 'user_profile_safe_travel';

export class SecureStorageService {
  /**
   * Save a string value securely (or fallback to localStorage on web)
   */
  static async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return true;
      }
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.warn(`Storage write failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a string value securely (or fallback to localStorage on web)
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Storage read failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a string value securely (or fallback to localStorage on web)
   */
  static async deleteItem(key: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return true;
      }
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.warn(`Storage delete failed for key ${key}:`, error);
      return false;
    }
  }

  // --- Convenience wrappers for token management ---

  static async saveAuthToken(token: string): Promise<boolean> {
    return this.setItem(TOKEN_KEY, token);
  }

  static async getAuthToken(): Promise<string | null> {
    return this.getItem(TOKEN_KEY);
  }

  static async clearAuthToken(): Promise<boolean> {
    return this.deleteItem(TOKEN_KEY);
  }

  static async saveUserProfile(user: any): Promise<boolean> {
    try {
      const userString = JSON.stringify(user);
      return await this.setItem(USER_KEY, userString);
    } catch (error) {
      console.warn('Failed to stringify user profile for SecureStore:', error);
      return false;
    }
  }

  static async getUserProfile(): Promise<any | null> {
    try {
      const userString = await this.getItem(USER_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.warn('Failed to parse user profile from SecureStore:', error);
      return null;
    }
  }

  static async clearAll(): Promise<void> {
    await this.clearAuthToken();
    await this.deleteItem(USER_KEY);
  }
}

export default SecureStorageService;
