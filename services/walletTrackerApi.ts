import { config } from '../lib/config';
import { tokenInterceptor } from './tokenInterceptor';
import { 
  TrackedWallet, 
  TrackedWalletCreate, 
  TrackedWalletListCreate, 
  CopyTradingLog, 
  CopyTradingStats,
  WalletStats 
} from '../store/types/auth';

class WalletTrackerApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WalletTrackerApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new WalletTrackerApiError(
      errorData.detail || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

export const walletTrackerApi = {
  async startTrackingWallet(walletData: TrackedWalletCreate, coin: string = 'sol'): Promise<TrackedWallet> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/track/${coin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletData),
      });

      return await handleResponse(response);
    });
  },



  async stopTrackingWallet(walletAddress: string, coin: string = 'sol'): Promise<{ message: string }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/track/${coin}/${walletAddress}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getTrackedWallets(page: number = 1, limit: number = 10, coin: string = 'sol'): Promise<{ wallets: TrackedWallet[], total: number, page: number, totalPages: number }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallets/${coin}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },



  async getAllLogs(page: number = 1, limit: number = 10, coin: string = 'sol'): Promise<{ logs: CopyTradingLog[], total_count: number, page: number, limit: number, total_pages: number }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallets/logs/${coin}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getCopyTradingStats(coin: string = 'sol'): Promise<CopyTradingStats> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/stats/${coin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      

      return await handleResponse(response);
    });
  },

  async getTrackedWalletSettings(walletAddress: string, coin: string = 'sol'): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/tracked-wallet/${coin}/${walletAddress}/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return await handleResponse(response);
    });
  },

  async updateTrackedWalletSettings(walletAddress: string, settings: any, coin: string = 'sol'): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/tracked-wallet/${coin}/${walletAddress}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      return await handleResponse(response);
    });
  },

  async withdraw(coin: string, destination: string, amount: number): Promise<{ message: string }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/wallet/withdraw/${coin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination, amount }),
      });

      return await handleResponse(response);
    });
  },

  async customBuy(coin: string, tokenAddress: string, amount: number, slippage: number): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/custom/buy/${coin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_address: tokenAddress, amount, slippage }),
      });
      return await handleResponse(response);
    });
  },

  async customSell(coin: string, tokenAddress: string, amount: number, slippage: number): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/custom/sell/${coin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_address: tokenAddress, amount, slippage }),
      });
      return await handleResponse(response);
    });
  },
};

