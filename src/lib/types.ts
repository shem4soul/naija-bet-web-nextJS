// Types mirror the Naija Sportsbook API (src/docs/openapi.yaml in the backend repo).
// Money values arrive as NGN decimal strings ("1500.00"); odds as strings ("1.950").

export type Money = string;

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "user" | "admin";
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
  status: "active" | "suspended" | "banned" | "closed";
  selfExclusionUntil?: string | null;
  createdAt?: string;
}

export interface Profile extends User {
  wallet: { balance: Money; currency: string } | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}

export interface AuthResponse extends TokenPair {
  user: User;
}

export interface Wallet {
  balance: Money;
  currency: string;
  updatedAt?: string;
}

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "withdrawal_reversal"
  | "bet_stake"
  | "bet_payout"
  | "bet_void_refund"
  | "bet_cashout"
  | "game_stake"
  | "game_payout"
  | "adjustment";

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: string;
  balance_after: Money;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
}

export interface DepositInit {
  reference: string;
  amount: Money;
  currency: string;
  authorizationUrl: string;
  accessCode: string;
  publicKey?: string;
}

export interface Deposit {
  reference: string;
  amount: Money;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
  channel: string | null;
  authorizationUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export interface BankAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt?: string;
}

export type WithdrawalStatus =
  | "pending_review"
  | "approved"
  | "processing"
  | "success"
  | "failed"
  | "reversed"
  | "rejected";

export interface Withdrawal {
  id: number;
  amount: Money;
  currency: string;
  status: WithdrawalStatus;
  reference: string;
  failureReason: string | null;
  bankAccountId: number;
  bankName: string;
  accountNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositLimit {
  period: "daily" | "weekly" | "monthly";
  limit: Money | null;
  used: Money;
  pendingLimit: Money | null;
  pendingRemoval: boolean;
  pendingEffectiveAt: string | null;
}

export interface League {
  id: number;
  slug: string;
  name: string;
  short_name: string | null;
  country: string | null;
  country_code: string | null;
  is_featured: boolean;
  sport: string;
  upcoming_events: number;
}

export interface OddsQuote {
  oddsId: number;
  selection: string;
  price: string;
}

export type EventStatus = "scheduled" | "live" | "finished" | "cancelled" | "postponed";

export interface EventSummary {
  id: number;
  home_team: string;
  away_team: string;
  start_time: string;
  status: EventStatus;
  home_score: number | null;
  away_score: number | null;
  is_featured: boolean;
  league_slug: string;
  league_name: string;
  country: string | null;
  sport: string;
  main_market_id: number | null;
  main_odds: OddsQuote[] | null;
  open_markets: number;
}

export interface MarketOdds {
  oddsId: number;
  selection: string;
  price: string;
  active: boolean;
  result: "pending" | "won" | "lost" | "void";
}

export interface Market {
  id: number;
  type: string;
  name: string;
  line: string | null;
  status: "open" | "suspended" | "settled" | "void";
  odds: MarketOdds[];
}

export interface EventDetail {
  id: number;
  home_team: string;
  away_team: string;
  start_time: string;
  status: EventStatus;
  home_score: number | null;
  away_score: number | null;
  ht_home_score: number | null;
  ht_away_score: number | null;
  is_featured: boolean;
  league_id: number;
  league_slug: string;
  league_name: string;
  country: string | null;
  sport: string;
  markets: Market[];
}

export interface FeaturedLeague {
  league: { slug: string; name: string; shortName: string | null; country: string | null };
  events: EventSummary[];
}

export type BetStatus = "pending" | "won" | "lost" | "void" | "cashed_out";

export interface BetSelection {
  oddsId: number;
  eventId: number;
  match: string;
  league: string;
  startTime: string;
  marketType: string;
  line: string | null;
  selection: string;
  price: string;
  result: "pending" | "won" | "lost" | "void";
}

export interface BetSlip {
  id: number;
  betType: "single" | "multi";
  stake: Money;
  totalOdds: string;
  potentialPayout: Money;
  payout: Money | null;
  status: BetStatus;
  bookingCode: string | null;
  createdAt: string;
  settledAt: string | null;
  idempotentReplay?: boolean;
  selections: BetSelection[];
}

export interface CashoutQuote {
  betId: number;
  available: boolean;
  amount?: Money;
  reason?: string;
}

export interface CashoutResult {
  betId: number;
  cashedOut: Money;
  balance: Money;
}

export interface BookingCodeDetail {
  code: string;
  expiresAt: string;
  totalOdds: string | null;
  selections: {
    oddsId: number;
    eventId: number;
    match: string;
    startTime: string;
    marketType: string;
    line: string | null;
    selection: string;
    price: string;
    available: boolean;
  }[];
}

export interface Game {
  slug: string;
  name: string;
  type: "dice" | "coinflip" | "slots";
  rtp_percent: string;
  min_bet: Money;
  max_bet: Money;
}

export interface FairnessState {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface RotateSeedResult {
  previous: { serverSeed: string; serverSeedHash: string; clientSeed: string; finalNonce: number } | null;
  newServerSeedHash: string;
  clientSeed: string;
}

export interface RoundResultBase {
  roundId: number;
  game: string;
  nonce: number;
  serverSeedHash: string;
  won: boolean;
  multiplier: number;
  payout: Money;
  balance: Money;
}

export interface DiceResult extends RoundResultBase {
  roll: number;
  target: number;
  direction: "under" | "over";
}

export interface CoinflipResult extends RoundResultBase {
  result: "heads" | "tails";
  call: "heads" | "tails";
}

export interface SlotsResult extends RoundResultBase {
  reels: string[];
}

export interface GameRound {
  id: number;
  game: string;
  stake: Money;
  multiplier: string;
  payout: Money;
  result: Record<string, unknown>;
  outcome: "win" | "loss";
  nonce: number;
  created_at: string;
  server_seed_hash: string;
  client_seed: string;
  revealed_server_seed: string | null;
}
