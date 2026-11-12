import { partnerProvinces, partnerStages, type PartnerApproval, type PartnerReview, type PartnerStage } from './partner-profile';

/** 창고·물류센터 임대 등록 정보. 연락처·상세 주소는 비공개로만 보관한다. */
export const warehouseRoles = ['소유주(임대인)', '관리 회사·대리인', '현 임차인(전대·조기 퇴거)'] as const;
export const warehouseFacilityTypes = ['물류센터', '창고', '공장'] as const;
export const warehouseTemperatures = ['상온', '냉장', '냉동'] as const;
export const warehouseLeaseScopes = ['전체 임대', '부분 임대 가능', '전체·부분 모두 가능'] as const;
export const warehouseAreaUnits = ['평', '㎡'] as const;
export const warehouseDisclosures = ['담당자와 협의 후 결정', '지역·규모·조건 공개 희망', '비공개 매칭만 희망'] as const;
export const WAREHOUSE_PUBLIC_DISCLOSURE = warehouseDisclosures[1];
export const WAREHOUSE_PRIVATE_DISCLOSURE = warehouseDisclosures[2];
export const warehouseStages = partnerStages;
export const PYEONG_M2 = 3.3058;
export const WAREHOUSE_SOURCE = '창고 임대 등록';
/** 새 창고 등록과 예전 상담폼(창고·물류센터 임대 홍보) 접수를 함께 창고 등록으로 본다. */
export const isWarehouseRegistration = (r: { kind: string; source: string; help: string }) => r.kind === 'partnership' && (r.source === WAREHOUSE_SOURCE || r.help === '창고·물류센터 임대 홍보');

export interface WarehouseProfile {
  role: string; company: string; name: string; phone: string; email: string;
  province: string; district: string; dong: string; address: string;
  facilityType: string; temperatures: string[]; leaseScope: string;
  areaValue: string; areaUnit: string;
  floor: string; height: string; dock: string; vehicle: string; power: string; buildingUse: string;
  rent: string; deposit: string; maintenance: string; availableAt: string; minTerm: string;
  introduction: string; photoUrl: string; documentUrl: string; disclosure: string; note: string;
}
export type WarehouseErrors = Record<string, string>;
export interface WarehouseView {
  review?: PartnerReview; approval?: PartnerApproval;
  profile: WarehouseProfile; stage: PartnerStage; revision: string;
}

export const emptyWarehouse = (): WarehouseProfile => ({
  role: warehouseRoles[0], company: '', name: '', phone: '', email: '',
  province: '', district: '', dong: '', address: '',
  facilityType: '', temperatures: [], leaseScope: warehouseLeaseScopes[0], areaValue: '', areaUnit: '평',
  floor: '', height: '', dock: '', vehicle: '', power: '', buildingUse: '',
  rent: '', deposit: '', maintenance: '', availableAt: '', minTerm: '',
  introduction: '', photoUrl: '', documentUrl: '', disclosure: warehouseDisclosures[0], note: '',
});

const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};

/** 면적 입력값을 ㎡ 정수로 바꾼다. 숫자가 아니면 undefined. */
export function warehouseAreaM2(p: Pick<WarehouseProfile, 'areaValue' | 'areaUnit'>) {
  const n = Number(p.areaValue.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(p.areaUnit === '㎡' ? n : n * PYEONG_M2);
}
export function warehouseAreaLabel(p: Pick<WarehouseProfile, 'areaValue' | 'areaUnit'>) {
  const n = Number(p.areaValue.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString('ko-KR')}${p.areaUnit}` : '';
}

export function normalizeWarehouse(input: unknown, consent: unknown, requireConsent = true) {
  const raw = object(input);
  const errors: WarehouseErrors = {};
  const text = (key: keyof WarehouseProfile, max: number, required = false) => {
    const v = raw[key];
    const value = typeof v === 'string' ? v.trim() : '';
    if (required && !value) errors[key] = '입력해 주세요.';
    else if (value.length > max) errors[key] = `${max}자 이내로 입력해 주세요.`;
    return value;
  };
  const pick = (key: keyof WarehouseProfile, allowed: readonly string[], fallback?: string) => {
    const value = String(raw[key] ?? '');
    if (allowed.includes(value)) return value;
    if (fallback !== undefined) return fallback;
    errors[key] = '선택해 주세요.';
    return '';
  };
  const url = (key: keyof WarehouseProfile) => {
    const value = text(key, 500);
    if (value) {
      try {
        const parsed = new URL(value);
        if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
      } catch { errors[key] = 'https://로 시작하는 웹 주소를 입력해 주세요.'; }
    }
    return value;
  };
  const temperatures = () => {
    const temps = raw.temperatures;
    if (Array.isArray(temps) && temps.length && temps.length <= warehouseTemperatures.length && temps.every(t => typeof t === 'string' && (warehouseTemperatures as readonly string[]).includes(t))) return [...new Set(temps as string[])];
    errors.temperatures = '해당하는 온도대를 1개 이상 선택해 주세요.';
    return [];
  };
  // 오류 순서 = 화면 순서. 첫 오류 칸으로 포커스가 이동한다.
  const profile: WarehouseProfile = {
    role: pick('role', warehouseRoles, warehouseRoles[0]),
    company: text('company', 100, true), name: text('name', 50, true), phone: text('phone', 30, true), email: text('email', 254),
    province: pick('province', partnerProvinces), district: text('district', 50, true), dong: text('dong', 50), address: text('address', 200),
    facilityType: pick('facilityType', warehouseFacilityTypes), temperatures: temperatures(),
    leaseScope: pick('leaseScope', warehouseLeaseScopes, warehouseLeaseScopes[0]),
    areaValue: text('areaValue', 12, true), areaUnit: pick('areaUnit', warehouseAreaUnits, '평'),
    floor: text('floor', 50), height: text('height', 20), dock: text('dock', 50), vehicle: text('vehicle', 50), power: text('power', 40), buildingUse: text('buildingUse', 50),
    rent: text('rent', 30), deposit: text('deposit', 20), maintenance: text('maintenance', 30), availableAt: text('availableAt', 60), minTerm: text('minTerm', 60),
    introduction: text('introduction', 300), photoUrl: url('photoUrl'), documentUrl: url('documentUrl'),
    disclosure: pick('disclosure', warehouseDisclosures, warehouseDisclosures[0]), note: text('note', 2000),
  };
  if (!errors.phone && !/^(0[0-9]{8,10}|1[568][0-9]{6})$/.test(profile.phone.replace(/[\s-]/g, ''))) errors.phone = '연락 가능한 전화번호를 확인해 주세요.';
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = '이메일 주소를 확인해 주세요.';
  if (!errors.areaValue && warehouseAreaM2(profile) === undefined) errors.areaValue = '면적은 숫자로 입력해 주세요. 예: 1,000';
  if (requireConsent && consent !== true) errors.consent = '개인정보 수집·이용 안내를 확인하고 동의해 주세요.';
  return { profile, errors };
}

export function warehouseSummary(p: WarehouseProfile) {
  return [
    `등록자: ${p.company} (${p.role})`, `담당자: ${p.name}`, `연락처: ${p.phone}${p.email ? ` · ${p.email}` : ''}`,
    `소재지: ${p.province} ${p.district}${p.dong ? ` ${p.dong}` : ''}${p.address ? ` · ${p.address}` : ''}`,
    `유형: ${p.facilityType} · ${p.temperatures.join(', ')} · ${p.leaseScope}`, `임대 면적: ${warehouseAreaLabel(p) || p.areaValue}`,
    `월 임대료: ${p.rent || '협의'} · 보증금: ${p.deposit || '협의'} · 관리비: ${p.maintenance || '미입력'}`,
    `입주 가능: ${p.availableAt || '확인 필요'} · 최소 계약: ${p.minTerm || '미입력'}`,
    `층고: ${p.height || '미입력'} · 전력: ${p.power || '미입력'} · 도크: ${p.dock || '미입력'} · 차량: ${p.vehicle || '미입력'}`,
    `건축물 용도: ${p.buildingUse || '미입력'} · 층: ${p.floor || '미입력'}`,
    `사진: ${p.photoUrl || '미입력'} · 자료: ${p.documentUrl || '미입력'}`,
    `공개 희망: ${p.disclosure}`, `추가 안내: ${p.note || '없음'}`,
  ].join('\n');
}

/** 화주에게 후보로 소개하기 전에 채워야 할 항목. */
export function warehouseReadiness(p: WarehouseProfile) {
  const missing: string[] = [];
  const checks: [keyof WarehouseProfile, string][] = [['rent', '월 임대료'], ['deposit', '보증금'], ['availableAt', '입주 가능 시점'], ['height', '층고'], ['power', '전력'], ['dock', '도크·접안'], ['buildingUse', '건축물대장상 용도'], ['address', '상세 주소(비공개)'], ['photoUrl', '시설 사진 링크']];
  for (const [key, label] of checks) if (!p[key]) missing.push(label);
  return missing;
}
