import { authApi } from './authApi';
import { store } from '../store';
import { refreshToken } from '../store/slices/authSlice';

class TokenInterceptor {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  async handleUnauthorized(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      await store.dispatch(refreshToken());
      
      this.processQueue(null);
      return true;
    } catch (error) {
      this.processQueue(error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  async makeAuthenticatedRequest<T>(
    requestFn: () => Promise<T>,
    retryCount = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (error.status === 401 && retryCount > 0) {
        const refreshSuccess = await this.handleUnauthorized();
        
        if (refreshSuccess) {
          return this.makeAuthenticatedRequest(requestFn, retryCount - 1);
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }
      
      throw error;
    }
  }
}

export const tokenInterceptor = new TokenInterceptor();
