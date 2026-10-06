import type { InquiryData, InquiryErrors, Listing, ListingFilters } from './types';

export const COMPARE_LIMIT = 3;

/** 매물 ID 형식(URL에 쓰는 영문 slug). supabase/schema.sql의 check 제약과 같다. */
export const LISTING_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,47}$/;

export function filterListings<T extends Pick<Listing, 'type' | 'name' | 'region' | 'district' | 'tags' | 'service' | 'temperature'> & { province?: string; area?: number }>(
  items: T[],
  { query = '', region = '전체 지역', temperature = '전체 온도', type, size = '전체 면적' }: ListingFilters = {},
): T[] {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (type && item.type !== type) return false;
    if (region !== '전체 지역' && item.region !== region && item.province !== region) return false;
    if (temperature !== '전체 온도' && item.temperature !== temperature) return false;
    if (size !== '전체 면적') {
      // 면적 미상(undefined)은 어느 면적 조건에도 포함하지 않는다.
      const matches = size === '1,000㎡ 미만' ? (item.area as number) < 1000 : (item.area as number) >= 1000;
      if (!matches) return false;
    }
    const haystack = `${item.name} ${item.province || ''} ${item.region} ${item.district} ${item.tags.join(' ')} ${item.service}`;
    return haystack.toLocaleLowerCase().includes(normalized);
  });
}

export function validateInquiry(data: Partial<InquiryData>, partnership = false): InquiryErrors {
  const errors: InquiryErrors = {};
  if (!data.name?.trim()) errors.name = '담당자 이름을 입력해 주세요.';
  if (!data.company?.trim()) errors.company = '회사명을 입력해 주세요.';
  if (!/^0[0-9]{8,10}$/.test((data.phone || '').replace(/[\s-]/g, ''))) errors.phone = '연락 가능한 전화번호를 확인해 주세요.';
  if (!partnership && !data.item?.trim()) errors.item = '취급 품목 또는 아직 모름을 입력해 주세요.';
  if (!data.consent) errors.consent = '개인정보 수집·이용 및 국외 이전에 동의해 주세요.';
  return errors;
}

export function toggleSelection(current: string[], id: string, limit = COMPARE_LIMIT): string[] {
  if (current.includes(id)) return current.filter((value) => value !== id);
  return current.length >= limit ? current : [...current, id];
}

/**
 * localStorage 등 신뢰할 수 없는 값에서 유효한 비교 ID만 남긴다(중복 제거·최대 3개).
 * validIds가 null이면(공개 매물 목록을 아직 받지 못함) ID 형식만 검사한다.
 */
export function sanitizeSelection(value: unknown, validIds: readonly string[] | null, limit = COMPARE_LIMIT): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((id): id is string => typeof id === 'string' && (validIds ? validIds.includes(id) : LISTING_ID_PATTERN.test(id)));
  return [...new Set(ids)].slice(0, limit);
}
