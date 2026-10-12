import { describe, expect, test } from 'vitest';
import { capacityLabel } from '@/lib/data';

const sqm = (pyeong: number) => pyeong * 3.3058;

describe('capacityLabel', () => {
  test('1,000평 넘는 물류센터는 1,000평~최대 3,000평 범위로 표기한다', () => {
    expect(capacityLabel({ name: '김해시 상동면 2,000평 물류센터 임대', area: sqm(2000), capacity: '약 2,000평' })).toBe('1,000~2,000평 임대 가능');
    expect(capacityLabel({ name: '울주군 삼남읍 물류센터 임대', area: sqm(5945), capacity: '약 5,945평' })).toBe('1,000~3,000평 임대 가능');
  });

  test('1,000평 이하 물류센터와 창고, 면적 없는 항목은 원래 표기를 쓴다', () => {
    expect(capacityLabel({ name: '창원시 진해구 두동 1,000평 물류센터 임대', area: sqm(1000), capacity: '약 1,000평' })).toBe('약 1,000평');
    expect(capacityLabel({ name: '양산시 산막동 400평 물류센터 임대', area: sqm(400), capacity: '약 400평' })).toBe('약 400평');
    expect(capacityLabel({ name: '부산 강서구 송정동 2,532평 창고 임대', area: sqm(2532), capacity: '약 2,532평' })).toBe('약 2,532평');
    expect(capacityLabel({ name: '부산권 수출입 3PL 파트너', capacity: '물량별 확인' })).toBe('물량별 확인');
  });
});
