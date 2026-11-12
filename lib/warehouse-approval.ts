import type { ListingInput } from './listing-form';
import type { Point } from './partner-approval';
import { warehouseAreaLabel, warehouseAreaM2, type WarehouseProfile } from './warehouse-profile';

export const warehouseListingId = (id: number) => `registered-warehouse-${id}`;

/**
 * 등록자가 저장한 정보로 공개 창고 매물을 만든다. 등록자·연락처·상세 주소·사진 링크는 넣지 않는다.
 * 이미 공개한 매물이면 등록자 입력 항목만 다시 덮고, 담당자가 고친 검증 표시·태그·정렬은 유지한다.
 * 보증금은 등록자가 적은 값을 그대로 쓰고 계산하지 않는다.
 */
export function warehouseApprovalListing(id: number, p: WarehouseProfile, point: Point, existing?: ListingInput): ListingInput {
  const area = warehouseAreaLabel(p);
  const district = p.dong ? `${p.district} ${p.dong}` : p.district;
  const temperature = p.temperatures.length === 1 ? p.temperatures[0] : '복수 온도대';
  const fromProfile = {
    name: `${district} ${p.facilityType}${area ? ` ${area}` : ''}`,
    region: p.province, province: p.province, district, temperature,
    area: warehouseAreaM2(p), capacity: `임대 ${area}${p.leaseScope === '전체 임대' ? '' : ' · 부분 임대 협의'}`,
    price: p.rent ? `${p.rent}${p.deposit ? ` · 보증금 ${p.deposit.replace(/^보증금\s*/, '')}` : ''}` : '임대 조건 협의',
    available: p.availableAt || '입주 일정 확인 필요',
    height: p.height || undefined, power: p.power || undefined,
    service: `${p.facilityType} 임대 · ${p.leaseScope}`,
    suitability: p.introduction || `${p.temperatures.join('·')} ${p.facilityType} 임대 공간 · 화주 조건별 수용 여부 확인`,
    lat: point.lat, lng: point.lng,
  };
  if (existing) return { ...existing, ...fromProfile, type: 'warehouse' };
  return {
    ...fromProfile, id: warehouseListingId(id), type: 'warehouse',
    tags: [p.facilityType, ...p.temperatures, ...(p.leaseScope === '전체 임대' ? [] : ['부분 임대'])].slice(0, 8),
    status: '임대인 등록 정보', checks: ['임대인 입력', '서류 확인 대기', '현장 확인 대기', '화주 조건 확인 대기'],
    limitation: '임대 조건·입주 일정·관리비는 상담 시 확인합니다.', sortOrder: 100,
  };
}
