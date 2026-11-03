import type { ListingInput } from './listing-form';
import type { PartnerProfile } from './partner-profile';

/** Public introduction draft: never copy contacts, documents, notes or center details. */
export function partnerListingDraft(id: number, profile: PartnerProfile): Partial<ListingInput> {
  const first = profile.regions[0];
  return {
    operatingRegions: profile.regions.map(r=>({province:r.province,district:r.district})),
    publicPartner: {categories: profile.categories ?? [], temperatures: profile.temperatures, centers: []},
    imageUrl: profile.logoUrl || undefined,
    id: `registered-partner-${id}`, type: 'partner', name: profile.company,
    province: first.province, region: first.province,
    district: first.district,
    temperature: profile.temperatures.length === 1 ? profile.temperatures[0] : '복수 온도대',
    tags: profile.services, service: profile.services.join(' · '),
    capacity: '물량별 확인 필요', price: '물량 기준 견적', available: '수용 일정 확인 필요',
    status: '업체 등록 정보', checks: ['업체 입력', '서류 확인 대기', '현장 확인 대기', '화주 조건 확인 대기'],
    suitability: profile.introduction || (profile.categories?.length ? `${profile.categories.join(' · ')} 취급 화주 · 수용 여부 별도 확인` : ''), limitation: '처리 가능량·비용·수용 조건은 상담 시 확인합니다.', sortOrder: 100,
  };
}
