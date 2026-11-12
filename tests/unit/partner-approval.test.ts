import { describe, expect, test } from 'vitest';
import { approvalListing, approvalStatus, validateApprovalListing } from '@/lib/partner-approval';
import { emptyPartner, type PartnerProfile } from '@/lib/partner-profile';

const logo = 'data:image/webp;base64,' + btoa('RIFF\0\0\0\0WEBPVP8 ');
const profile: PartnerProfile = { ...emptyPartner(), company: '(주)테스트 물류센터', name: '담당', phone: '010-0000-0000', regions: [{ province: '경남', district: '김해시 대동면' }],
  services: ['보관', '입출고'], temperatures: ['상온', '냉장'], categories: ['식품'], introduction: '식품 전문 3PL입니다.', logoUrl: logo, disclosure: '업체명·서비스 공개 희망' };
const point = { lat: 35.24, lng: 128.98 };

describe('partner approval', () => {
  test('tracks whether the supplier changed anything after approval', () => {
    expect(approvalStatus({ revision: 'a' })).toBe('미공개');
    expect(approvalStatus({ revision: 'a', approval: { revision: 'a', at: '', listingId: 'x' } })).toBe('공개 중');
    expect(approvalStatus({ revision: 'b', approval: { revision: 'a', at: '', listingId: 'x' } })).toBe('변경 승인 대기');
  });

  test('builds a valid public listing from the saved profile without contacts', () => {
    const { value, errors } = validateApprovalListing(approvalListing(8, profile, point));
    expect(errors).toEqual({});
    expect(value).toMatchObject({ id: 'registered-partner-8', type: 'partner', name: '(주)테스트 물류센터', district: '김해시 대동면', temperature: '복수 온도대', imageUrl: logo, lat: 35.24 });
    expect(JSON.stringify(value)).not.toContain('010-0000-0000');
  });

  test('re-approval refreshes supplier fields but keeps admin edits', () => {
    const first = validateApprovalListing(approvalListing(8, profile, point)).value;
    const edited = { ...first, checks: ['업체 입력', '서류 확인', '현장 확인', '화주 조건 확인 대기'] as typeof first.checks, capacity: '약 2,900평', sortOrder: 5,
      publicPartner: { ...first.publicPartner!, centers: [{ province: '경남', district: '김해시', temperatures: ['냉장'], services: ['보관'] }] } };
    const next = validateApprovalListing(approvalListing(8, { ...profile, company: '(주)푸드엔 물류센터', temperatures: ['냉동'] }, point, edited)).value;
    expect(next).toMatchObject({ name: '(주)푸드엔 물류센터', temperature: '냉동', capacity: '약 2,900평', sortOrder: 5 });
    expect(next.checks[1]).toBe('서류 확인');
    expect(next.publicPartner?.centers).toHaveLength(1);
    expect(next.publicPartner?.temperatures).toEqual(['냉동']);
  });

  test('rejects a street address typed into the public fields', () => {
    const { errors } = validateApprovalListing(approvalListing(8, { ...profile, regions: [{ province: '경남', district: '대동로 123' }] }, point));
    expect(errors.district).toBeTruthy();
  });
});
