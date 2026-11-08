import { describe, expect, it } from 'vitest';
import { partnerListingDraft } from '../../lib/partner-listing';
import { emptyPartner } from '../../lib/partner-profile';
import { isExampleListing } from '../../lib/data';

describe('partner public introduction', () => {
  it('copies public business information without private fields or invented coordinates', () => {
    const draft = partnerListingDraft(42, { ...emptyPartner(), company: '테스트 물류', name: '비공개 담당자', phone: '01012345678', note: '비공개 메모', documentUrl: 'https://example.com/private', regions: [{ province: '경남', district: '김해시' }], services: ['보관', '운송'], temperatures: ['상온', '냉장'] });
    expect(draft).toMatchObject({ id: 'registered-partner-42', name: '테스트 물류', temperature: '복수 온도대', service: '보관 · 운송' });
    expect(draft).not.toHaveProperty('lat');
    for (const value of ['비공개 담당자', '01012345678', '비공개 메모', 'https://example.com/private']) expect(JSON.stringify(draft)).not.toContain(value);
  });
  it('distinguishes registered information without a property source URL from seed examples', () => {
    expect(isExampleListing({ isExample: false })).toBe(false);
    expect(isExampleListing({})).toBe(true);
  });
});

it('carries the approved brand introduction and logo into the public draft', () => {
  const logo='https://example.com/logo.png';
  const draft=partnerListingDraft(7,{...emptyPartner(),company:'물류사',regions:[{province:'부산',district:'강서구'}],temperatures:['상온'],services:['보관'],logoUrl:logo,introduction:'공개 회사 소개',quoteEmail:'private@example.com',info:{insurance:'내부 검토용'}});
  expect(draft.imageUrl).toBe(logo);expect(draft.suitability).toBe('공개 회사 소개');
  expect(JSON.stringify(draft)).not.toContain('private@example.com');expect(JSON.stringify(draft)).not.toContain('내부 검토용');
});
