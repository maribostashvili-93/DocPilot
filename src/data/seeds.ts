import type { FreeBetGrant, LimitRow, RaindropCampaign, RecentRound, TranslationPack } from '../types';

export const DEFAULT_RAINDROPS: RaindropCampaign[] = [
  {
    "id": "rd-001",
    "name": "Friday Night Rain",
    "status": "active",
    "claimsTotal": 60,
    "claimsUsed": 25,
    "value": 2.5,
    "currency": "DMO",
    "multiplier": 1,
    "minCashout": 1.5,
    "startsAt": "2026-05-04T18:00",
    "endsAt": "2026-05-04T22:00",
    "segment": "all"
  },
  {
    "id": "rd-002",
    "name": "VIP Boost",
    "status": "scheduled",
    "claimsTotal": 100,
    "claimsUsed": 0,
    "value": 10,
    "currency": "DMO",
    "multiplier": 2,
    "minCashout": 1.5,
    "startsAt": "2026-05-08T20:00",
    "endsAt": "2026-05-08T23:00",
    "segment": "vip"
  },
  {
    "id": "rd-003",
    "name": "Weekend Welcome",
    "status": "ended",
    "claimsTotal": 200,
    "claimsUsed": 200,
    "value": 1,
    "currency": "DMO",
    "multiplier": 1,
    "minCashout": 1.2,
    "startsAt": "2026-04-26T10:00",
    "endsAt": "2026-04-27T22:00",
    "segment": "new"
  }
];

export const DEFAULT_FREEBETS: FreeBetGrant[] = [
  {
    "id": "fb-1042",
    "segment": "all",
    "quantity": 100,
    "amount": 5,
    "currency": "DMO",
    "minCashout": 1.5,
    "expiresAt": "2026-06-01",
    "status": "active",
    "createdAt": "2026-05-01"
  },
  {
    "id": "fb-1041",
    "segment": "vip",
    "quantity": 20,
    "amount": 25,
    "currency": "DMO",
    "minCashout": 2,
    "expiresAt": "2026-05-15",
    "status": "active",
    "createdAt": "2026-04-28"
  },
  {
    "id": "fb-1040",
    "segment": "new",
    "quantity": 50,
    "amount": 1,
    "currency": "DMO",
    "minCashout": 1.2,
    "expiresAt": "2026-04-30",
    "status": "expired",
    "createdAt": "2026-04-15"
  }
];

export const DEFAULT_LIMITS: LimitRow[] = [
  {
    "code": "DMO",
    "minBet": 1,
    "maxBet": 500,
    "maxWin": 10000
  },
  {
    "code": "GEL",
    "minBet": 0.1,
    "maxBet": 1000,
    "maxWin": 50000
  },
  {
    "code": "USD",
    "minBet": 0.1,
    "maxBet": 500,
    "maxWin": 25000
  },
  {
    "code": "EUR",
    "minBet": 0.1,
    "maxBet": 500,
    "maxWin": 25000
  }
];

export const DEFAULT_TRANSLATIONS: TranslationPack[] = [
  {
    "code": "en",
    "name": "English",
    "nativeName": "English",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "es",
    "name": "Spanish",
    "nativeName": "Español",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "pt",
    "name": "Portuguese",
    "nativeName": "Português",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "it",
    "name": "Italian",
    "nativeName": "Italiano",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "fr",
    "name": "French",
    "nativeName": "Français",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "de",
    "name": "German",
    "nativeName": "Deutsch",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "ru",
    "name": "Russian",
    "nativeName": "Русский",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "tr",
    "name": "Turkish",
    "nativeName": "Türkçe",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "pl",
    "name": "Polish",
    "nativeName": "Polski",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "ro",
    "name": "Romanian",
    "nativeName": "Română",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "bg",
    "name": "Bulgarian",
    "nativeName": "Български",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "el",
    "name": "Greek",
    "nativeName": "Ελληνικά",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "cs",
    "name": "Czech",
    "nativeName": "Čeština",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "hu",
    "name": "Hungarian",
    "nativeName": "Magyar",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "sk",
    "name": "Slovak",
    "nativeName": "Slovenčina",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "hr",
    "name": "Croatian",
    "nativeName": "Hrvatski",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "sr",
    "name": "Serbian",
    "nativeName": "Српски",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "sl",
    "name": "Slovenian",
    "nativeName": "Slovenščina",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "sq",
    "name": "Albanian",
    "nativeName": "Shqip",
    "version": "0.9.0",
    "updatedAt": "2026-02-04",
    "status": "disabled"
  },
  {
    "code": "bs",
    "name": "Bosnian",
    "nativeName": "Bosanski",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "mk",
    "name": "Macedonian",
    "nativeName": "Македонски",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "et",
    "name": "Estonian",
    "nativeName": "Eesti",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "lv",
    "name": "Latvian",
    "nativeName": "Latviešu",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "lt",
    "name": "Lithuanian",
    "nativeName": "Lietuvių",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "fi",
    "name": "Finnish",
    "nativeName": "Suomi",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "sv",
    "name": "Swedish",
    "nativeName": "Svenska",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "nb",
    "name": "Norwegian",
    "nativeName": "Norsk",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "da",
    "name": "Danish",
    "nativeName": "Dansk",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "nl",
    "name": "Dutch",
    "nativeName": "Nederlands",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "uk",
    "name": "Ukrainian",
    "nativeName": "Українська",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "ka",
    "name": "Georgian",
    "nativeName": "ქართული",
    "version": "1.0.1",
    "updatedAt": "2026-04-30",
    "status": "active"
  },
  {
    "code": "hy",
    "name": "Armenian",
    "nativeName": "Հայերեն",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "az",
    "name": "Azerbaijani",
    "nativeName": "Azərbaycan",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "kk",
    "name": "Kazakh",
    "nativeName": "Қазақша",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "hi",
    "name": "Hindi",
    "nativeName": "हिन्दी",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  },
  {
    "code": "th",
    "name": "Thai",
    "nativeName": "ไทย",
    "version": "0.9.0",
    "updatedAt": "2026-02-04",
    "status": "disabled"
  },
  {
    "code": "vi",
    "name": "Vietnamese",
    "nativeName": "Tiếng Việt",
    "version": "1.0.0",
    "updatedAt": "2026-03-12",
    "status": "active"
  }
];

export const DEFAULT_RECENT_ROUNDS: RecentRound[] = [
  {
    "id": "69f4288...8d20",
    "time": "15:42:18",
    "mult": 1.34,
    "totalBets": 482,
    "totalWins": 0,
    "status": "flying"
  },
  {
    "id": "69f4287...91ca",
    "time": "15:41:55",
    "mult": 2.9,
    "totalBets": 875,
    "totalWins": 7517.55,
    "status": "crashed"
  },
  {
    "id": "69f4286...75bb",
    "time": "15:41:22",
    "mult": 1.79,
    "totalBets": 891,
    "totalWins": 2161.03,
    "status": "crashed"
  },
  {
    "id": "69f4285...c317",
    "time": "15:40:47",
    "mult": 8.2,
    "totalBets": 1102,
    "totalWins": 12483.4,
    "status": "crashed"
  },
  {
    "id": "69f4284...4488",
    "time": "15:40:11",
    "mult": 1.07,
    "totalBets": 769,
    "totalWins": 412.85,
    "status": "crashed"
  },
  {
    "id": "69f4283...91f0",
    "time": "15:39:34",
    "mult": 11.27,
    "totalBets": 932,
    "totalWins": 18904.2,
    "status": "crashed"
  },
  {
    "id": "69f4282...0c57",
    "time": "15:38:58",
    "mult": 1,
    "totalBets": 415,
    "totalWins": 0,
    "status": "crashed"
  },
  {
    "id": "69f4281...4774",
    "time": "15:38:21",
    "mult": 24.73,
    "totalBets": 1218,
    "totalWins": 41200.1,
    "status": "crashed"
  }
];
