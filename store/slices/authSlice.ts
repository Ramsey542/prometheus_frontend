import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, SignupRequest, LoginRequest, TokenPair, User, Wallet, UserProfile, VerifyEmailRequest, PasswordResetRequest, PasswordResetConfirm, CreateWalletRequest } from '../types/auth';
import { authApi } from '../../services/authApi';

const initialState: AuthState = {
  user: null,
  tokens: null,
  wallet: null,
  profile: null,
  selectedCoin: 'sol',
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const signup = createAsyncThunk(
  'auth/signup',
  async (payload: SignupRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.signup(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (coin: 'sol' | 'bnb' = 'sol', { rejectWithValue, dispatch }) => {
    try {
      const response = await authApi.getProfile(coin);
      return response;
    } catch (error: any) {
      if (error.status === 401) {
        try {
          await dispatch(refreshToken());
          const retryResponse = await authApi.getProfile(coin);
          return retryResponse;
        } catch (refreshError: any) {
          return rejectWithValue('Session expired. Please login again.');
        }
      }
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfileForCoin = createAsyncThunk(
  'auth/updateProfileForCoin',
  async (coin: 'sol' | 'bnb', { dispatch, rejectWithValue }) => {
    try {
      const profileResult = await dispatch(getProfile(coin));
      if (getProfile.fulfilled.match(profileResult)) {
        return { coin, profile: profileResult.payload };
      } else {
        return rejectWithValue(profileResult.payload || 'Failed to fetch profile for coin');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile for coin');
    }
  }
);

export const loginWithProfile = createAsyncThunk(
  'auth/loginWithProfile',
  async (payload: LoginRequest, { dispatch, rejectWithValue }) => {
    try {
      const loginResult = await dispatch(login(payload));

      if (login.fulfilled.match(loginResult)) {
        const profileResult = await dispatch(getProfile('sol'));

        if (getProfile.fulfilled.match(profileResult)) {
          const profile = profileResult.payload;

          const user = {
            id: profile.id.toString(),
            username: profile.username,
            email: profile.email
          };
          localStorage.setItem('user', JSON.stringify(user));

          return {
            login: loginResult.payload,
            profile: profileResult.payload,
            user
          };
        } else {
          return {
            login: loginResult.payload,
            profile: null,
            user: null,
            profileError: profileResult.payload
          };
        }
      } else {
        return rejectWithValue(loginResult.payload || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login with profile failed');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const profileResult = await dispatch(getProfile('sol'));
          if (getProfile.fulfilled.match(profileResult)) {
            return {
              tokens: { access_token: accessToken, refresh_token: refreshToken },
              profile: profileResult.payload
            };
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            return null;
          }
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return null;
        }
      }
      return null;
    } catch (error: any) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (payload: VerifyEmailRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyEmail(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Email verification failed');
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (payload: PasswordResetRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.requestPasswordReset(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset request failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: PasswordResetConfirm, { rejectWithValue }) => {
    try {
      const response = await authApi.resetPassword(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const createWallet = createAsyncThunk(
  'auth/createWallet',
  async (payload: CreateWalletRequest, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await authApi.createWallet(payload);
      const state = getState() as { auth: AuthState };
      await dispatch(getProfile(state.auth.selectedCoin));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create wallet');
    }
  }
);

export const selectWallet = createAsyncThunk(
  'auth/selectWallet',
  async ({ walletId, blockchain }: { walletId: string; blockchain: 'solana' | 'bnb' }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await authApi.selectWallet(walletId, { blockchain });
      const state = getState() as { auth: AuthState };
      await dispatch(getProfile(state.auth.selectedCoin));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to select wallet');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ tokens: TokenPair; user: User; wallet?: Wallet }>) => {
      state.tokens = action.payload.tokens;
      state.user = action.payload.user;
      state.wallet = action.payload.wallet || null;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.tokens = null;
      state.wallet = null;
      state.profile = null;
      state.selectedCoin = 'sol';
      state.isAuthenticated = false;
      state.error = null;
    },
    setCoin: (state, action: PayloadAction<'sol' | 'bnb'>) => {
      state.selectedCoin = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.wallet = action.payload.wallet || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = null;
        state.wallet = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null;
        state.tokens = null;
        state.wallet = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        // Find the active wallet for the selected coin and update state.wallet
        const blockchain = state.selectedCoin === 'sol' ? 'solana' : 'bnb';
        state.wallet = action.payload.wallets.find((w: Wallet) =>
          blockchain === 'solana' ? w.is_active_sol : w.is_active_bnb
        ) || null;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if (action.payload && typeof action.payload === 'string' && action.payload.includes('Session expired')) {
          state.user = null;
          state.tokens = null;
          state.wallet = null;
          state.profile = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loginWithProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload.login;
        state.wallet = action.payload.login.wallet || null;
        state.profile = action.payload.profile;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = action.payload.profileError as string || null;
      })
      .addCase(loginWithProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfileForCoin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileForCoin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCoin = action.payload.coin;
        state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(updateProfileForCoin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.tokens = action.payload.tokens;
          state.profile = action.payload.profile;
          state.user = action.payload.profile ? {
            id: action.payload.profile.id.toString(),
            username: action.payload.profile.username,
            email: action.payload.profile.email
          } : null;
          state.wallet = action.payload.profile?.wallets.find((w: Wallet) => w.is_active_sol) || null;
          state.isAuthenticated = true;
          state.error = null;
        }
      })
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.wallet = action.payload.wallet || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials, clearAuth, setCoin } = authSlice.actions;
export default authSlice.reducer;
