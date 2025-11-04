export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  sol_trade_amount: process.env.NEXT_PUBLIC_TRADE_AMOUNT || 0.1,
  bnb_trade_amount: process.env.NEXT_PUBLIC_BNB_TRADE_AMOUNT || 0.1,
  discord_link: process.env.NEXT_PUBLIC_DISCORD_LINK || '',
}
