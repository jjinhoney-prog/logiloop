import { parseListingForm, type ListingFormErrors, type ListingInput } from './listing-form';
import { partnerListingDraft } from './partner-listing';
import type { PartnerProfile, PartnerView } from './partner-profile';

export const PUBLIC_DISCLOSURE = '업체명·서비스 공개 희망';
export const PRIVATE_DISCLOSURE = '비공개 매칭만 희망';
export type Point = { lat: number; lng: number };

/** 공개 중인 업체가 승인 뒤에 정보를 다시 저장했는지. */
export type ApprovalStatus = '미공개' | '공개 중' | '변경 승인 대기';
export function approvalStatus(view: Pick<PartnerView, 'revision' | 'approval'>): ApprovalStatus {
  if (!view.approval) return '미공개';
  return view.approval.revision === view.revision ? '공개 중' : '변경 승인 대기';
}

/**
 * 업체가 저장한 최신 정보로 공개 매물을 만든다. 이미 공개한 매물이 있으면
 * 업체 입력에서 오는 항목(이름·지역·온도·서비스·소개·로고)만 새로 덮고,
 * 담당자가 고친 검증 표시·규모·가격·정렬·센터 정보는 그대로 둔다.
 */
export function approvalListing(id: number, profile: PartnerProfile, point: Point, existing?: ListingInput): ListingInput {
  const draft = partnerListingDraft(id, profile);
  const fromProfile = {
    name: draft.name!, region: draft.region!, province: draft.province, district: draft.district!,
    temperature: draft.temperature!, tags: draft.tags!, service: draft.service!, suitability: draft.suitability!,
    imageUrl: draft.imageUrl, operatingRegions: draft.operatingRegions, lat: point.lat, lng: point.lng,
  };
  if (existing) {
    return {
      ...existing, ...fromProfile,
      suitability: fromProfile.suitability || existing.suitability,
      publicPartner: { ...(existing.publicPartner ?? { centers: [] }), categories: draft.publicPartner!.categories, temperatures: draft.publicPartner!.temperatures },
    };
  }
  return {
    ...fromProfile, id: draft.id!, type: 'partner', capacity: draft.capacity!, price: draft.price!, available: draft.available!,
    status: draft.status!, limitation: draft.limitation!, checks: draft.checks as ListingInput['checks'],
    publicPartner: draft.publicPartner, sortOrder: draft.sortOrder ?? 100,
  };
}

/** 관리자 폼과 같은 검증(상세 주소·로고 형식·좌표)을 거친다. 3PL·창고 매물 공통. */
export function validateApprovalListing(input: ListingInput): { value: ListingInput; errors: ListingFormErrors } {
  const form = new FormData();
  const put = (key: string, value: unknown) => { if (value !== undefined && value !== null) form.set(key, typeof value === 'string' ? value : JSON.stringify(value)); };
  put('type', input.type); put('id', input.id); put('area', input.area === undefined ? undefined : String(input.area)); put('height', input.height); put('power', input.power); put('name', input.name); put('region', input.region); put('province', input.province);
  put('district', input.district); put('temperature', input.temperature); put('capacity', input.capacity); put('price', input.price);
  put('available', input.available); put('status', input.status); put('tags', input.tags.join(',')); put('service', input.service);
  put('suitability', input.suitability); put('limitation', input.limitation); put('imageUrl', input.imageUrl ?? '');
  input.checks.forEach((check, i) => put(`check${i}`, check));
  put('lat', String(input.lat)); put('lng', String(input.lng)); put('sortOrder', String(input.sortOrder)); put('sourceUrl', input.sourceUrl);
  put('publicPartner', input.publicPartner ?? {}); put('operatingRegions', input.operatingRegions ?? []);
  return parseListingForm(form, { requireId: true });
}
