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
  stable_balance?: string;
  stable_symbol?: string;
  usdt_trade_amount?: number | null;
  usdc_trade_amount?: number | null;
  sol_priority_fee_level?: SolPriorityFeeLevel;
  sol_priority_fee_scopes?: SolPriorityFeeScope[];
  sol_priority_fee_enabled?: boolean;
  sol_priority_fee_dynamic?: boolean;
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

export type SolPriorityFeeLevel = 'auto' | 'low' | 'medium' | 'high' | 'very_high' | 'unsafe_max_fee';
export type SolPriorityFeeScope = 'all' | 'copy_trade' | 'tp_sl' | 'dip_ladder' | 'buy_the_dip' | 'spike_entry';

export interface TrackedWallet {
  id: number;
  user_id: string;
  wallet_address: string;
  is_active: boolean;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  total_volume_traded: number;
  total_pnl?: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
  allow_buys?: boolean;
  swap_strategy?: string;
  buy_the_dip?: boolean;
  buy_dip_percentage?: number;
  max_dip_percentage?: number;
  dip_ladder_drop_percentage?: number;
  dip_ladder_profit_percentage?: number;
  min_liquidity_usd?: number | null;
  max_liquidity_usd?: number | null;
  require_locked_liquidity?: boolean;
  min_lp_locked_pct?: number | null;
  bundler_tracking_enabled?: boolean;
  max_bundle_supply_pct?: number | null;
  time_limit_sells_enabled?: boolean;
  time_limit_profit_pct?: number | null;
  time_limit_seconds?: number | null;
  trailing_take_profit_enabled?: boolean;
  trailing_take_profit_activation_pct?: number | null;
  trailing_take_profit_distance_pct?: number | null;
  trailing_take_profit_sell_pct?: number | null;
  trailing_stop_loss_enabled?: boolean;
  trailing_stop_loss_activation_pct?: number | null;
  trailing_stop_loss_distance_pct?: number | null;
  trailing_stop_loss_sell_pct?: number | null;
  buy_dip_timeout?: number;
  dip_recovery?: boolean;
  custom_name?: string;
  dip_recovery_percentage?: number;
  dip_recovery_timeout?: number;
  is_default?: boolean;
  slippage?: number;
  time_filter_enabled?: boolean;
  time_filter_seconds?: number | null;
  entry_on_first_swap?: boolean;
  buy_once_per_token?: boolean;
  copy_only_new_positions?: boolean;
  spike_entry_enabled?: boolean;
  spike_entry_pullback_percentage?: number;
  spike_entry_margin_percentage?: number;
  spike_entry_timeout_seconds?: number;
  spike_entry_require_unsold_mirror?: boolean;
  jito_tip_enabled?: boolean;
  jito_tip_lamports?: number;
  mirror_sells_enabled?: boolean;
  swap_notifications_enabled?: boolean;
  swap_notification_sound?: string;
  sol_trade_amount?: number | null;
  bnb_trade_amount?: number | null;
  tracking_type?: any;
}

export interface TrackedWalletCreate {
  wallet_address: string;
  is_active?: boolean;
  tracking_type?: any;
}

export interface TrackedWalletListCreate {
  wallets: string[];
  is_active?: boolean;
  tracking_type?: any;
}

export interface DipLadderLotPnl {
  cost_basis_usd: number;
  current_value_usd: number;
  unrealized_pnl_usd: number;
  unrealized_pnl_percentage?: number | null;
  realized_pnl_usd: number;
  realized_pnl_percentage?: number | null;
  final_pnl_usd?: number | null;
  final_pnl_percentage?: number | null;
  basis_source: string;
}

export interface DipLadderLot {
  id: number;
  entry_price_usd: number;
  target_price_usd: number;
  buy_amount_native: number;
  amount_tokens: number;
  remaining_amount_tokens: number;
  buy_tx_signature?: string | null;
  sell_tx_signature?: string | null;
  status: string;
  last_error?: string | null;
  sell_failure_count?: number;
  sell_retry_after?: string | null;
  created_at: string;
  updated_at: string;
  pnl?: DipLadderLotPnl | null;
}

export interface DipLadder {
  id: number;
  user_id: number;
  tracked_wallet_id?: number | null;
  wallet_address: string;
  token_address: string;
  coin_type: string;
  token_name?: string | null;
  token_symbol?: string | null;
  token_logo_uri?: string | null;
  anchor_price_usd: number;
  next_buy_price_usd: number;
  last_price_usd?: number | null;
  drop_percentage: number;
  profit_percentage: number;
  max_buy_count?: number | null;
  max_drawdown_percentage?: number | null;
  update_buy_trigger_on_sell: boolean;
  cycle_buy_count?: number;
  cycle_drawdown_percentage?: number | null;
  status: string;
  last_error?: string | null;
  last_checked_at?: string | null;
  created_at: string;
  updated_at: string;
  lots: DipLadderLot[];
  total_cost_basis_usd?: number;
  total_unrealized_pnl_usd?: number;
  total_realized_pnl_usd?: number;
  total_pnl_usd?: number;
  total_pnl_percentage?: number | null;
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
  time_limit_sells_enabled?: boolean | null;
  time_limit_profit_pct?: number | null;
  time_limit_seconds?: number | null;
  trailing_take_profit_enabled?: boolean | null;
  trailing_take_profit_activation_pct?: number | null;
  trailing_take_profit_distance_pct?: number | null;
  trailing_take_profit_sell_pct?: number | null;
  trailing_stop_loss_enabled?: boolean | null;
  trailing_stop_loss_activation_pct?: number | null;
  trailing_stop_loss_distance_pct?: number | null;
  trailing_stop_loss_sell_pct?: number | null;
  is_tp_sl_sell?: boolean | null;
  tp_sl_trigger_type?: string | null;
  tp_sl_trigger_value?: number | null;
  tp_sl_trigger_price?: number | null;
  tp_sl_buy_price?: number | null;
  is_spike_entry?: boolean | null;
  spike_entry_is_active?: boolean | null;
  spike_entry_monitor?: SpikeEntryMonitor | null;
  entry_on_first_swap?: boolean;
  buy_once_per_token?: boolean;
  copy_only_new_positions?: boolean;
  spike_entry_enabled?: boolean;
  spike_entry_pullback_percentage?: number;
  spike_entry_margin_percentage?: number;
  spike_entry_timeout_seconds?: number;
  spike_entry_require_unsold_mirror?: boolean;
  mirror_sells_enabled?: boolean;
}

export interface SpikeEntryMonitor {
  id: number;
  tracked_wallet_id: number;
  wallet_address: string;
  token_address: string;
  coin_type: string;
  mirror_tx_signature?: string | null;
  base_token?: string | null;
  mirror_entry_price: number;
  spike_target_price: number;
  pullback_target_price: number;
  pullback_percentage: number;
  margin_percentage: number;
  timeout_seconds: number;
  max_seen_price?: number | null;
  current_price?: number | null;
  status: string;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletStats {
  wallet_address: string;
  is_active: boolean;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  success_rate: number;
  total_volume_traded: number;
  total_pnl: number;
}

export interface CopyTradingStats {
  total_tracked_wallets: number;
  active_wallets: number;
  total_matches: number;
  successful_trades: number;
  failed_trades: number;
  success_rate: number;
  total_volume_traded: number;
  total_pnl: number;
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
