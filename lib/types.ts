export type ListingType = 'warehouse' | 'partner';

export type TierId = 1 | 2 | 3;

export type TierIcon = 'Search' | 'SlidersHorizontal' | 'Workflow';

export interface Tier {
  id: TierId;
  name: string;
  eyebrow: string;
  description: string;
  result: string;
  price: string;
  icon: TierIcon;
}

/** 공급자 입력 · 서류 확인 · 현장 확인 · 해당 화주 조건 수용 확인 */
export type VerificationChecks = [string, string, string, string];

export interface Listing {
  id: string;
  name: string;
  region: string;
  /** 광역 시·도. 기초 지역(김해 등)을 광역(경남) 필터에 포함할 때 사용 */
  province?: string;
  district: string;
  type: ListingType;
  temperature: string;
  /** ㎡. 파트너는 면적 개념이 없어 비워 둔다 */
  area?: number;
  capacity: string;
  price: string;
  available: string;
  status: string;
  tags: string[];
  height?: string;
  power?: string;
  service: string;
  suitability: string;
  limitation: string;
  checks: VerificationChecks;
  /** 권역 대표 중심점(WGS84). 실제 매물 위치가 아니다. */
  lat: number;
  lng: number;
}

export interface Hub {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface HubDistance {
  hub: string;
  km: number | null;
  minutes: number | null;
  /** 경로 계산 실패 시 '확인 불가' */
  note?: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  description: string;
  read: string;
  sections: [title: string, body: string][];
}

export interface DemoInquiry {
  id: string;
  company: string;
  item: string;
  region: string;
  tier: TierId;
  status: string;
  owner: string;
  hours: number;
  next: string;
}

export interface InquiryData {
  tier: TierId;
  help: string;
  item: string;
  volume: string;
  region: string;
  regionDetail: string;
  timing: string;
  temperature: string;
  company: string;
  name: string;
  phone: string;
  note: string;
  consent: boolean;
  source: string;
}

export type InquiryErrors = Partial<Record<'name' | 'company' | 'phone' | 'item' | 'consent', string>>;

export interface ListingFilters {
  query?: string;
  region?: string;
  temperature?: string;
  type?: ListingType;
  size?: string;
}
