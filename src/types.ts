export type Status = 'active' | 'scheduled' | 'ended' | 'expired' | 'disabled';

export type Segment = 'all' | 'new' | 'vip';

export interface RaindropCampaign {
  id: string;
  name: string;
  status: Extract<Status, 'active' | 'scheduled' | 'ended'>;
  claimsTotal: number;
  claimsUsed: number;
  value: number;
  currency: string;
  multiplier: number;
  minCashout: number;
  startsAt: string;
  endsAt: string;
  segment: Segment;
}

export interface FreeBetGrant {
  id: string;
  segment: Segment;
  quantity: number;
  amount: number;
  currency: string;
  minCashout: number;
  expiresAt: string;
  status: Extract<Status, 'active' | 'expired'>;
  createdAt: string;
}

export interface LimitRow {
  code: string;
  minBet: number;
  maxBet: number;
  maxWin: number;
}

export interface TranslationPack {
  code: string;
  name: string;
  nativeName: string;
  version: string;
  updatedAt: string;
  status: Extract<Status, 'active' | 'disabled'>;
}

export interface RecentRound {
  id: string;
  time: string;
  mult: number;
  totalBets: number;
  totalWins: number;
  status: 'flying' | 'crashed';
}
