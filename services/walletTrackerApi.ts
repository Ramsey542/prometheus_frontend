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

      const response = await fetch(`${config.apiBaseUrl}/track/wallet/${coin}`, {
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

  async bulkStartTrackingWallets(walletData: TrackedWalletListCreate, coin: string = 'sol'): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const response = await fetch(`${config.apiBaseUrl}/track/wallet/${coin}/bulk`, {
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



  async stopTrackingWallet(walletId: number, disableTpSl: boolean = false): Promise<{ message: string }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const url = `${config.apiBaseUrl}/track/wallet/${walletId}?disable_tp_sl=${disableTpSl}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async deleteTrackedWallet(walletId: number): Promise<{ success: boolean; message: string }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      const url = `${config.apiBaseUrl}/track/tracked-wallet/${walletId}`;

      const response = await fetch(url, {
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



  async getAllLogs(page: number = 1, limit: number = 10, coin: string = 'sol', filters?: { event_type?: string, status?: string, side?: string, wallet_address?: string }): Promise<{ logs: CopyTradingLog[], total_count: number, page: number, limit: number, total_pages: number }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      let url = `${config.apiBaseUrl}/copy-trading/wallets/logs/${coin}?page=${page}&limit=${limit}`;
      if (filters) {
        if (filters.event_type && filters.event_type !== 'all') url += `&event_type=${filters.event_type}`;
        if (filters.status && filters.status !== 'all') url += `&status=${filters.status}`;
        if (filters.side && filters.side !== 'all') url += `&side=${filters.side}`;
        if (filters.wallet_address && filters.wallet_address !== 'all') url += `&wallet_address=${filters.wallet_address}`;
      }

      const response = await fetch(url, {
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

  async getTrackedWalletSettings(walletAddress: string, coin: string = 'sol', walletId?: number): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }

      let url = `${config.apiBaseUrl}/copy-trading/tracked-wallet/${coin}/${walletAddress}/settings`;
      if (walletId) {
        url += `?wallet_id=${walletId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return await handleResponse(response);
    });
  },

  async updateTrackedWalletSettings(walletAddress: string, settings: any, coin: string = 'sol', trackingType?: string, walletId?: number | string): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        throw new WalletTrackerApiError('No access token found', 401);
      }
      console.log('the settings is', settings);

      let url = `${config.apiBaseUrl}/copy-trading/tracked-wallet/${coin}/${walletAddress}/settings`;
      if (trackingType) {
        url += `?tracking_type=${trackingType}`;
      }

      const payload = {
        ...settings,
        wallet_id: walletId
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('the full response is', response);

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

  async claimDust(coin: string, walletAddress: string, tokenAddresses: string[], slippage: number): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/claim-dust/${coin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: walletAddress, token_addresses: tokenAddresses, slippage }),
      });
      return await handleResponse(response);
    });
  },

  async getTokenBalances(coin: string = 'sol', offset: number = 0, limit: number = 20): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet/tokens/balances/${coin}?offset=${offset}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return await handleResponse(response);
    });
  },

  async getTrackedPositions(coin: string = 'sol'): Promise<Record<string, { tp_sl_active: boolean; buy_price: number; remaining_amount: number; targets: Array<{ type: string; percentage: number; sell_percentage: number; target_price: number }>; decimals_adjusted: boolean; mirror_address: string | null }>> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/tracked-positions/${coin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return await handleResponse(response);
    });
  },

  async generatePnlImage(tokenAddress: string, tokenSymbol: string, sent: string, received: string, pnl: number | null | undefined, transactionSignature: string | null, coin: string = 'sol'): Promise<Blob> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/pnl-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          sent: sent,
          received: received,
          pnl: pnl,
          transaction_signature: transactionSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new WalletTrackerApiError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      return await response.blob();
    });
  },

  async getAdminOverview(): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/admin/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getAdminLogs(page: number = 1, limit: number = 50, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);

      const response = await fetch(`${config.apiBaseUrl}/admin/log?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getAdminLeadWallets(): Promise<{ lead_wallets: Array<{ wallet_address: string; followers: number; win_rate: number; total_pnl: number; tracking_status: 'active' | 'inactive' }> }> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/admin/lead-wallets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getAdminUsers(page: number = 1, limit: number = 20, search?: string): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetch(`${config.apiBaseUrl}/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getAdminUserStats(userId: number): Promise<any> {
    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return await handleResponse(response);
    });
  },

  async getNotificationSounds(): Promise<string[]> {

    return tokenInterceptor.makeAuthenticatedRequest(async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new WalletTrackerApiError('No access token found', 401);

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/sounds`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return await handleResponse(response);
    });
  },


};

