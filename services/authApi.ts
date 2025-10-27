import { config } from '../lib/config';
import { SignupRequest, LoginRequest, TokenPair, UserProfile } from '../store/types/auth';

class AuthApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AuthApiError(
      errorData.detail || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

export const authApi = {
  async signup(payload: SignupRequest): Promise<TokenPair> {
    console.log(config.apiBaseUrl);
    const response = await fetch(`${config.apiBaseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response);
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  },

  async login(payload: LoginRequest): Promise<TokenPair> {
    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response);
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    if (data.wallet) {
      localStorage.setItem('wallet', JSON.stringify(data.wallet));
    }
    

    const user = {
      id: 'temp-id', 
      username: payload.username,
      email: 'temp@email.com' 
    };
    localStorage.setItem('user', JSON.stringify(user));
    
    return data;
  },

  async logout(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken) {
      try {
        await fetch(`${config.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
  },

  getStoredTokens(): { access_token: string | null; refresh_token: string | null } {
    return {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
    };
  },

  getStoredUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredWallet(): any {
    const walletStr = localStorage.getItem('wallet');
    return walletStr ? JSON.parse(walletStr) : null;
  },

  async refreshToken(): Promise<TokenPair> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new AuthApiError('No refresh token found', 401);
    }

    const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await handleResponse(response);
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  },

  async getProfile(coin: 'sol' | 'bnb' = 'sol'): Promise<UserProfile> {
    const accessToken = localStorage.getItem('access_token');
   
    if (!accessToken) {
      throw new AuthApiError('No access token found', 401);
    }

    const response = await fetch(`${config.apiBaseUrl}/auth/profile/coin/${coin}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  },
};
