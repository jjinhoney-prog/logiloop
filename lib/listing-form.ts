import { listingTemperatures, SOURCE_URL_PATTERN } from './data';
import { LISTING_ID_PATTERN } from './logic';
import type { Listing, ListingType, VerificationChecks } from './types';

/** 매물 등록·수정 폼에서 받는 값. visibility는 별도 동작(공개 전환·보관)으로만 바꾼다. */
export type ListingInput = Listing & { sortOrder: number };

export type ListingFormErrors = Partial<Record<keyof ListingInput | 'form', string>>;

// 오프마켓 보호: 공개 문구에 번지·도로명 상세 주소가 들어가지 않게 한다(동·권역 단위까지).
// "진입로 2곳"처럼 숫자 뒤에 단위가 붙으면 주소로 보지 않는다.
const DETAILED_ADDRESS = /\d+\s*번지|\d+\s*번길|[가-힣\d]+(로|길)\s*\d+(-\d+)?(?![\d가-힣a-zA-Z%㎡])/;

const LIMITS = { name: 80, region: 20, province: 20, district: 60, capacity: 60, price: 60, available: 60, status: 40, height: 20, power: 40, service: 200, suitability: 300, limitation: 300, check: 40, tag: 20 } as const;

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max);

/** 신뢰할 수 없는 폼 입력을 정리하고 검증한다. 서버 액션에서 사용 */
export function parseListingForm(form: FormData, { requireId }: { requireId: boolean }): { value: ListingInput; errors: ListingFormErrors } {
  const errors: ListingFormErrors = {};
  const type: ListingType = form.get('type') === 'partner' ? 'partner' : 'warehouse';
  const id = text(form, 'id', 48).toLowerCase();
  const areaRaw = text(form, 'area', 10).replace(/,/g, '');
  const area = areaRaw ? Number(areaRaw) : undefined;
  const lat = Number(text(form, 'lat', 20));
  const lng = Number(text(form, 'lng', 20));
  const sortOrder = Number(text(form, 'sortOrder', 6) || 100);
  const temperature = text(form, 'temperature', 20);
  const tags = [
    ...new Set(
      text(form, 'tags', 200)
        .split(',')
        .map((t) => t.trim().slice(0, LIMITS.tag))
        .filter(Boolean),
    ),
  ].slice(0, 8);
  const checks = [0, 1, 2, 3].map((i) => text(form, `check${i}`, LIMITS.check) || '확인 대기') as VerificationChecks;

  const value: ListingInput = {
    id,
    type,
    name: text(form, 'name', LIMITS.name),
    region: text(form, 'region', LIMITS.region),
    province: text(form, 'province', LIMITS.province) || undefined,
    district: text(form, 'district', LIMITS.district),
    temperature,
    area: type === 'warehouse' && area !== undefined && Number.isFinite(area) ? Math.round(area) : undefined,
    capacity: text(form, 'capacity', LIMITS.capacity),
    price: text(form, 'price', LIMITS.price) || '조건 협의',
    available: text(form, 'available', LIMITS.available) || '일정 확인 필요',
    status: text(form, 'status', LIMITS.status) || '확인 대기',
    tags,
    height: type === 'warehouse' ? text(form, 'height', LIMITS.height) || undefined : undefined,
    power: type === 'warehouse' ? text(form, 'power', LIMITS.power) || undefined : undefined,
    service: text(form, 'service', LIMITS.service),
    suitability: text(form, 'suitability', LIMITS.suitability),
    limitation: text(form, 'limitation', LIMITS.limitation),
    checks,
    lat,
    lng,
    sourceUrl: text(form, 'sourceUrl', 100) || undefined,
    sortOrder: Number.isInteger(sortOrder) ? Math.min(Math.max(sortOrder, 0), 9999) : 100,
  };

  if (requireId && !LISTING_ID_PATTERN.test(id)) errors.id = '영문 소문자·숫자·하이픈 2~48자로 입력해 주세요. 예: busan-02';
  if (!value.name) errors.name = '매물명을 입력해 주세요.';
  if (!value.region) errors.region = '지역을 입력해 주세요.';
  if (!value.district) errors.district = '권역을 입력해 주세요.';
  if (!listingTemperatures.includes(temperature)) errors.temperature = '온도대를 선택해 주세요.';
  if (areaRaw && (value.area === undefined || value.area <= 0) && type === 'warehouse') errors.area = '면적은 0보다 큰 숫자(㎡)로 입력해 주세요.';
  if (!value.capacity) errors.capacity = '규모 표기를 입력해 주세요. 예: 약 300평, 물량별 확인';
  if (value.sourceUrl && !SOURCE_URL_PATTERN.test(value.sourceUrl)) errors.sourceUrl = '지음부동산 매물 주소(https://ziumrealty.com/item/view/번호)만 입력할 수 있습니다.';
  if (!Number.isFinite(lat) || lat < 33 || lat > 39) errors.lat = '위도는 33~39 사이로 입력해 주세요.';
  if (!Number.isFinite(lng) || lng < 124 || lng > 132) errors.lng = '경도는 124~132 사이로 입력해 주세요.';
  for (const key of ['name', 'district', 'service', 'suitability', 'limitation'] as const) {
    if (DETAILED_ADDRESS.test(value[key])) errors[key] = '번지·도로명 상세 주소는 넣지 마세요. 동·권역 단위까지만 공개합니다.';
  }
  return { value, errors };
}
