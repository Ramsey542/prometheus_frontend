export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name?: string;
  is_active_sol: boolean;
  is_active_bnb: boolean;
  solana_public_key: string;
  solana_private_key: string;
  solana_balance: string;
  bnb_public_key?: string;
  bnb_private_key?: string;
  bnb_balance?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  wallet?: Wallet;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp_code: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  trade_amount: number;
  public_address: string;
  private_key: string;
  sol_balance: string;
  bnb_balance: string;
  total_trades: number;
  win_rate: number;
  active_trades: number;
  portfolio_value: string;
  active_mirrors: number;
  failed_trades?: number;
  is_admin?: boolean;
  is_debug_mode?: boolean;
  wallets: Wallet[];
}

export interface CreateWalletRequest {
  blockchain: 'solana' | 'bnb';
  name?: string;
}

export interface SelectWalletRequest {
  blockchain: 'solana' | 'bnb';
}

export interface TrackedWallet {
  id: number;
  user_id: string;
  wallet_address: string;
  is_active: boolean;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  total_volume_traded: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
  allow_buys?: boolean;
  swap_strategy?: string;
  buy_the_dip?: boolean;
  buy_dip_percentage?: number;
  max_dip_percentage?: number;
  buy_dip_timeout?: number;
  dip_recovery?: boolean;
  custom_name?: string;
  dip_recovery_percentage?: number;
  dip_recovery_timeout?: number;
  is_default?: boolean;
  slippage?: number;
  entry_on_first_swap?: boolean;
  buy_once_per_token?: boolean;
  mirror_sells_enabled?: boolean;
  swap_notifications_enabled?: boolean;
  swap_notification_sound?: string;
  sol_trade_amount?: number | null;
  bnb_trade_amount?: number | null;
}

export interface TrackedWalletCreate {
  wallet_address: string;
  is_active?: boolean;
}

export interface TrackedWalletListCreate {
  wallets: string[];
  is_active?: boolean;
}

export interface CopyTradingLog {
  id: number;
  user_id: number | null;
  event_type: string;
  transaction_signature: string | null;
  wallet_address: string | null;
  tracked_wallet_address?: string | null;
  wallet_name?: string | null;
  target_token: string | null;
  token_name: string | null;
  token_symbol: string | null;
  token_logo_uri: string | null;
  base_token: string | null;
  base_token_name: string | null;
  token_decimals: number | null;
  amount_in: string | null;
  amount_out: string | null;
  fee_amount: string | null;
  status: string | null;
  side: string | null;
  copied_wallet: string | null;
  error_message: string | null;
  event_data: string | null;
  dex_name: string | null;
  created_at: string;
  pnl?: number | null;
  is_active?: boolean;
  tp_sl_is_active?: boolean;
  current_price?: number | null;
  take_profit_levels?: Array<{ profit_percentage: number; sell_percentage: number }> | null;
  stop_loss_levels?: Array<{ loss_percentage: number; sell_percentage: number }> | null;
  is_tp_sl_sell?: boolean | null;
  tp_sl_trigger_type?: string | null;
  tp_sl_trigger_value?: number | null;
  tp_sl_trigger_price?: number | null;
  tp_sl_buy_price?: number | null;
  entry_on_first_swap?: boolean;
  buy_once_per_token?: boolean;
  mirror_sells_enabled?: boolean;
}

export interface WalletStats {
  wallet_address: string;
  is_active: boolean;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  success_rate: number;
  total_volume_traded: number;
}

export interface CopyTradingStats {
  total_tracked_wallets: number;
  active_wallets: number;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  success_rate: number;
  total_volume_traded: number;
  wallet_stats: WalletStats[];
}

export interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  wallet: Wallet | null;
  profile: UserProfile | null;
  selectedCoin: 'sol' | 'bnb';
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
