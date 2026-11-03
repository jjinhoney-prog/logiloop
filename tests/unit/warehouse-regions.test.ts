import { describe, expect, test } from 'vitest';
import { warehouseRegions, findWarehouseRegion, matchesWarehouseRegion } from '@/lib/warehouse-regions';
import { parseRequestContext } from '@/lib/search-params';
import { seedListings } from '@/lib/seed-listings';

const warehouse = { ...seedListings[0], sourceUrl: 'https://ziumrealty.com/item/view/10001' };

describe('지역별 공개 창고', () => {
  test('부산 강서와 다른 부산 권역·지역을 구분한다', () => {
    const region = warehouseRegions[0];
    expect(matchesWarehouseRegion({ ...warehouse, region: '부산', district: '강서구 대저1동' }, region)).toBe(true);
    expect(matchesWarehouseRegion({ ...warehouse, region: '부산', district: '사상구 감전동' }, region)).toBe(false);
    expect(matchesWarehouseRegion({ ...warehouse, region: '서울', district: '강서구' }, region)).toBe(false);
  });
  test('김해·양산 실매물만 포함하고 가상 예시와 물류사는 제외한다', () => {
    for (const region of warehouseRegions.slice(1)) {
      const item = { ...warehouse, region: region.name };
      expect(matchesWarehouseRegion(item, region)).toBe(true);
      expect(matchesWarehouseRegion({ ...item, sourceUrl: undefined }, region)).toBe(false);
      expect(matchesWarehouseRegion({ ...item, type: 'partner' }, region)).toBe(false);
      expect(matchesWarehouseRegion({ ...item, region: '창원' }, region)).toBe(false);
    }
  });
  test('허용되지 않은 지역은 별도 페이지로 만들지 않는다', () => {
    expect(findWarehouseRegion('seoul')).toBeUndefined();
    expect(findWarehouseRegion('__proto__')).toBeUndefined();
  });
  test('상담으로 이동할 때 광역·세부 지역을 모두 유지한다', () => {
    for (const region of warehouseRegions) {
      const result = parseRequestContext({ situation: 'space', region: region.requestRegion, regionDetail: region.requestDetail });
      expect(result.region).toBe(region.requestRegion);
      expect(result.regionDetail).toBe(region.requestDetail);
    }
    expect(parseRequestContext({ regionDetail: ['김해', '양산'] }).regionDetail).toBe('');
    expect(parseRequestContext({ regionDetail: '가'.repeat(160) }).regionDetail).toHaveLength(150);
  });
});
