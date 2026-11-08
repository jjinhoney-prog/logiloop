import { validPartnerLogo, partnerCategories, partnerInfoGroups, type PartnerInfoKey } from './partner-brand';
import { normalizeMetrics, type PartnerMetrics } from './partner-metrics';
/** Shared, non-secret partner profile schema. Storage/access credentials live server-side. */
export const partnerServices = ['보관', '입출고', '택배 출고', 'B2B 납품', '포장·임가공', '반품', '운송'] as const;
export const partnerTemperatures = ['상온', '냉장', '냉동'] as const;
export const partnerStages = ['접수', '확인 중', '보완 요청', '등록 준비 완료', '보류'] as const;
export type PartnerStage = typeof partnerStages[number];
export type PartnerErrors = Record<string, string>;
export interface PartnerRegion { province: string; district: string }
export interface PartnerCenter {
  temperature?: string; dailyOutbound?: string; peakOutbound?: string; equipment?: string; security?: string; capacityAsOf?: string;
  name: string; address: string; area: string; height: string; dock: string;
  vehicle: string; capacity: string; spareCapacity: string; availableAt: string;
  items: string; operations: string; photoUrl: string;
}
export interface PartnerMaterial { kind: string; url: string; updatedAt: string }
export interface PartnerProfile {
  logoUrl?: string; introduction?: string; categories?: string[]; info?: Partial<Record<PartnerInfoKey,string>>; metrics?: PartnerMetrics;
  quoteEmail?: string; quoteContact?: string; materials?: PartnerMaterial[];
  company: string; name: string; phone: string;
  regions: PartnerRegion[]; services: string[]; temperatures: string[];
  websiteUrl: string; documentUrl: string; disclosure: string; note: string;
  centers: PartnerCenter[];
}
export interface PartnerReview { reviewer: string; checkedAt: string; documents: string; notes: string }
export interface PartnerView {
  review?: PartnerReview;
  profile: PartnerProfile; stage: PartnerStage; revision: string;
}
export const partnerProvinces = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
export const partnerDisclosures = ['담당자와 협의 후 결정', '업체명·서비스 공개 희망', '비공개 매칭만 희망'];
export const emptyCenter = (): PartnerCenter => ({ dailyOutbound: '', peakOutbound: '', equipment: '', security: '', capacityAsOf: '', temperature: '', name: '', address: '', area: '', height: '', dock: '', vehicle: '', capacity: '', spareCapacity: '', availableAt: '', items: '', operations: '', photoUrl: '' });
export const emptyPartner = (): PartnerProfile => ({ logoUrl: '', introduction: '', categories: [], info: {}, metrics: {}, quoteEmail: '', quoteContact: '', materials: [], company: '', name: '', phone: '', regions: [{ province: '', district: '' }], services: [], temperatures: [], websiteUrl: '', documentUrl: '', disclosure: partnerDisclosures[0], note: '', centers: [] });

const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function normalizePartner(input: unknown, consent: unknown, requireConsent = true) {
  const raw = object(input);
  const errors: PartnerErrors = {};
  const text = (v: unknown, key: string, max: number, required = false) => {
    const value = typeof v === 'string' ? v.trim() : '';
    if (required && !value) errors[key] = '입력해 주세요.';
    if (value.length > max) errors[key] = `${max}자 이내로 입력해 주세요.`;
    return value;
  };
  const url = (v: unknown, key: string) => {
    const value = text(v, key, 500);
    if (value) {
      try {
        const parsed = new URL(value);
        if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      } catch { errors[key] = 'https://로 시작하는 웹 주소를 입력해 주세요.'; }
    }
    return value;
  };
  const choices = (v: unknown, key: string, allowed: readonly string[]) => {
    if (!Array.isArray(v) || !v.length || v.length > allowed.length || v.some(x => typeof x !== 'string' || !allowed.includes(x))) {
      errors[key] = '해당하는 항목을 1개 이상 선택해 주세요.';
      return [];
    }
    return [...new Set(v)] as string[];
  };
  const profile: PartnerProfile = {
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl.trim() : '', introduction:text(raw.introduction, 'introduction', 300), categories: [], info: {},
    quoteEmail: text(raw.quoteEmail ?? '', 'quoteEmail', 254), quoteContact: text(raw.quoteContact ?? '', 'quoteContact', 100), materials: [],
    company: text(raw.company, 'company', 100, true), name: text(raw.name, 'name', 50, true), phone: text(raw.phone, 'phone', 30, true),
    regions: [], services: choices(raw.services, 'services', partnerServices), temperatures: choices(raw.temperatures, 'temperatures', partnerTemperatures),
    websiteUrl: url(raw.websiteUrl, 'websiteUrl'), documentUrl: url(raw.documentUrl, 'documentUrl'),
    disclosure: partnerDisclosures.includes(String(raw.disclosure)) ? String(raw.disclosure) : partnerDisclosures[0],
    note: text(raw.note, 'note', 2000), centers: [],
  };
  if (!validPartnerLogo(profile.logoUrl!)) errors.logoUrl = '로고는 PNG·JPG·WebP 파일 또는 올바른 이미지 URL로 등록하세요.';
  if (raw.categories !== undefined) {
    if (!Array.isArray(raw.categories) || raw.categories.length > partnerCategories.length || raw.categories.some(c => !partnerCategories.includes(c))) errors.categories = '취급 품목을 확인하세요.';
    else profile.categories = [...new Set(raw.categories)] as string[];
  }
  const info = object(raw.info);
  for (const group of partnerInfoGroups) for (const [key] of group.fields) { const value = text(info[key], `info.${key}`, 1000); if (value) profile.info![key] = value; }
  profile.metrics = normalizeMetrics(raw.metrics, errors);
  if (profile.quoteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.quoteEmail)) errors.quoteEmail = '견적 수신 이메일을 확인하세요.';
  if (raw.materials !== undefined && (!Array.isArray(raw.materials) || raw.materials.length > 10)) errors.materials = '자료는 최대 10개입니다.';
  else if (Array.isArray(raw.materials)) profile.materials = raw.materials.map((value, i) => { const m = object(value); return {kind:text(m.kind, `materials.${i}.kind`, 100, true),url:url(m.url, `materials.${i}.url`),updatedAt:text(m.updatedAt ?? '', `materials.${i}.updatedAt`, 10)}; });
  if (!/^(0[0-9]{8,10}|1[568][0-9]{6})$/.test(profile.phone.replace(/[\s-]/g, ''))) errors.phone = '연락 가능한 전화번호를 확인해 주세요.';
  if (!Array.isArray(raw.regions) || !raw.regions.length || raw.regions.length > 10) errors.regions = '운영 지역을 1~10개 입력해 주세요.';
  else profile.regions = raw.regions.map((value, i) => {
    const r = object(value);
    const province = text(r.province, `regions.${i}.province`, 10, true);
    if (!partnerProvinces.includes(province)) errors[`regions.${i}.province`] = '시·도를 선택해 주세요.';
    return { province, district: text(r.district, `regions.${i}.district`, 50, true) };
  });
  if (!Array.isArray(raw.centers) || raw.centers.length > 10) errors.centers = '센터는 최대 10개까지 등록할 수 있습니다.';
  else profile.centers = raw.centers.map((value, i) => {
    const r = object(value); const center = emptyCenter();
    for (const key of Object.keys(center) as (keyof PartnerCenter)[]) {
      center[key] = key === 'photoUrl' ? url(r[key], `centers.${i}.${key}`) : text(r[key], `centers.${i}.${key}`, key === 'operations' ? 500 : 200, key === 'name' || key === 'address');
    }
    return center;
  });
  if (requireConsent && consent !== true) errors.consent = '개인정보 수집·이용 안내를 확인하고 동의해 주세요.';
  return { profile, errors };
}

export function partnerSummary(p: PartnerProfile) {
  return [
    `업체: ${p.company}`, `담당자: ${p.name}`, `연락처: ${p.phone}`,
    `운영 지역: ${p.regions.map(r => `${r.province} ${r.district}`).join(', ')}`,
    `서비스: ${p.services.join(', ')}`, `온도대: ${p.temperatures.join(', ')}`,
    `홈페이지: ${p.websiteUrl || '미입력'}`, `소개자료: ${p.documentUrl || '미입력'}`,
    `공개 희망: ${p.disclosure}`, `센터: ${p.centers.length}개`, `추가 안내: ${p.note || '없음'}`,
  ].join('\n');
}

/** 운영 지역이 입력된 사실과 상세 센터 보완 필요를 별도로 표시한다. */
export function partnerReadiness(p: PartnerProfile) {
  const missing: string[] = [];
  if (!p.quoteEmail) missing.push('견적 수신 이메일');
  if (!p.documentUrl && !p.materials?.some(m => m.url)) missing.push('소개·확인 자료 링크');
  if (!p.centers.length) missing.push(`운영 지역 ${p.regions.length}곳의 센터별 상세정보 연결`);
  p.centers.forEach((c,i) => {
    for (const [key,label] of [['temperature','운영 온도'],['capacity','전체 처리능력'],['spareCapacity','현재 여유 물량'],['availableAt','수용 가능 시점']] as const) if (!c[key]) missing.push(`센터 ${i+1} ${label}`);
  });
  return missing;
}
