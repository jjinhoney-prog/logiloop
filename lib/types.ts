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
  /** 지음부동산 홈페이지 매물 상세 주소. 있으면 실매물, 없으면 화면 확인용 예시 */
  sourceUrl?: string;
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

export type Visibility = 'hidden' | 'published' | 'archived';

/** 관리자 화면에서 쓰는 매물. 공개 화면에는 published만 Listing으로 내려간다. */
export interface AdminListing extends Listing {
  visibility: Visibility;
  sortOrder: number;
  updatedAt: string;
  inquiryCount: number;
}

/** 공개 매물 요약. 비교함 ID 검증과 WebMCP 도구에 사용 */
export type ListingSummary = Pick<Listing, 'id' | 'name' | 'region' | 'type' | 'temperature'>;

export type InquiryStage = '접수' | '연락 중' | '검토 중' | '종결';

export type MailStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface InquiryRecord {
  id: number;
  kind: 'consultation' | 'partnership';
  tier: TierId;
  help: string;
  company: string;
  name: string;
  phone: string;
  item: string;
  volume: string;
  region: string;
  regionDetail: string;
  timing: string;
  temperature: string;
  note: string;
  source: string;
  stage: InquiryStage;
  owner: string;
  nextAction: string;
  mailStatus: MailStatus;
  createdAt: string;
  listings: Pick<Listing, 'id' | 'name'>[];
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
