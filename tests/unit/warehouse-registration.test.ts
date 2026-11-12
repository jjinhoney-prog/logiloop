import { describe, expect, test } from 'vitest';
import { validateApprovalListing } from '@/lib/partner-approval';
import { warehouseApprovalListing } from '@/lib/warehouse-approval';
import { emptyWarehouse, isWarehouseRegistration, normalizeWarehouse, warehouseAreaM2, warehouseReadiness, type WarehouseProfile } from '@/lib/warehouse-profile';

const profile: WarehouseProfile = {
  ...emptyWarehouse(), company: '(주)테스트산업', name: '홍길동', phone: '010-1234-5678', email: 'owner@example.com',
  province: '경남', district: '김해시', dong: '주촌면', address: '주촌면 골든루트로 123',
  facilityType: '물류센터', temperatures: ['상온'], leaseScope: '부분 임대 가능', areaValue: '1,000', areaUnit: '평',
  height: '10m', power: '300kW', rent: '월 1,500만원', deposit: '1억원', availableAt: '즉시',
  introduction: '신항 20분, 40ft 트레일러 회차 가능합니다.', photoUrl: 'https://photos.example.com/album', disclosure: '지역·규모·조건 공개 희망',
};
const point = { lat: 35.24, lng: 128.83 };

describe('warehouse registration profile', () => {
  test('requires contact, location, type, temperature and area', () => {
    const { errors } = normalizeWarehouse({}, false);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['company', 'name', 'phone', 'province', 'district', 'facilityType', 'temperatures', 'areaValue', 'consent']));
  });

  test('accepts a complete registration and rejects bad phone, email, area and URLs', () => {
    expect(normalizeWarehouse(profile, true).errors).toEqual({});
    const { errors } = normalizeWarehouse({ ...profile, phone: '1234', email: 'nope', areaValue: '천평', photoUrl: 'javascript:alert(1)' }, true);
    expect(Object.keys(errors).sort()).toEqual(['areaValue', 'email', 'phone', 'photoUrl']);
  });

  test('ignores unknown choices instead of storing them', () => {
    const { profile: p, errors } = normalizeWarehouse({ ...profile, role: '해커', leaseScope: 'x', areaUnit: 'acre', disclosure: '전부 공개' }, true);
    expect(errors).toEqual({});
    expect(p).toMatchObject({ role: '소유주(임대인)', leaseScope: '전체 임대', areaUnit: '평', disclosure: '담당자와 협의 후 결정' });
  });

  test('converts area to square meters', () => {
    expect(warehouseAreaM2({ areaValue: '1,000', areaUnit: '평' })).toBe(3306);
    expect(warehouseAreaM2({ areaValue: '3300', areaUnit: '㎡' })).toBe(3300);
    expect(warehouseAreaM2({ areaValue: '0', areaUnit: '평' })).toBeUndefined();
  });

  test('lists what to fill before introducing it to shippers', () => {
    expect(warehouseReadiness(profile)).toEqual(['도크·접안', '건축물대장상 용도']);
  });

  test('separates warehouse registrations from 3PL partners in admin', () => {
    expect(isWarehouseRegistration({ kind: 'partnership', source: '창고 임대 등록', help: '창고·물류센터 임대 홍보' })).toBe(true);
    expect(isWarehouseRegistration({ kind: 'partnership', source: '홈페이지', help: '창고·물류센터 임대 홍보' })).toBe(true);
    expect(isWarehouseRegistration({ kind: 'partnership', source: '3PL 간편 등록', help: '물류사 서비스 소개' })).toBe(false);
    expect(isWarehouseRegistration({ kind: 'consultation', source: '창고 임대 등록', help: '' })).toBe(false);
  });
});

describe('warehouse approval listing', () => {
  test('publishes region, size and owner terms without contacts, address or photo link', () => {
    const { value, errors } = validateApprovalListing(warehouseApprovalListing(12, profile, point));
    expect(errors).toEqual({});
    expect(value).toMatchObject({
      id: 'registered-warehouse-12', type: 'warehouse', name: '김해시 주촌면 물류센터 1,000평', region: '경남', district: '김해시 주촌면',
      temperature: '상온', area: 3306, capacity: '임대 1,000평 · 부분 임대 협의', price: '월 1,500만원 · 보증금 1억원', available: '즉시',
      height: '10m', power: '300kW', suitability: '신항 20분, 40ft 트레일러 회차 가능합니다.', lat: 35.24,
    });
    const json = JSON.stringify(value);
    for (const secret of ['010-1234-5678', '홍길동', '(주)테스트산업', 'owner@example.com', '골든루트로', 'photos.example.com']) expect(json).not.toContain(secret);
  });

  test('keeps the deposit the owner entered and says terms are negotiable when rent is blank', () => {
    const value = validateApprovalListing(warehouseApprovalListing(12, { ...profile, rent: '', deposit: '' }, point)).value;
    expect(value.price).toBe('임대 조건 협의');
  });

  test('re-approval refreshes owner fields but keeps admin edits', () => {
    const first = validateApprovalListing(warehouseApprovalListing(12, profile, point)).value;
    const edited = { ...first, checks: ['임대인 입력', '서류 확인', '현장 확인', '화주 조건 확인 대기'] as typeof first.checks, tags: ['신항 인접'], sortOrder: 3 };
    const next = validateApprovalListing(warehouseApprovalListing(12, { ...profile, rent: '월 1,400만원', temperatures: ['상온', '냉장'] }, point, edited)).value;
    expect(next).toMatchObject({ price: '월 1,400만원 · 보증금 1억원', temperature: '복수 온도대', tags: ['신항 인접'], sortOrder: 3 });
    expect(next.checks[1]).toBe('서류 확인');
  });

  test('rejects a street address typed into public fields', () => {
    const { errors } = validateApprovalListing(warehouseApprovalListing(12, { ...profile, introduction: '골든루트로 123 위치' }, point));
    expect(errors.suitability).toBeTruthy();
  });
});
