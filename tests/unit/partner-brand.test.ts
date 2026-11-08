import { expect, test } from 'vitest';
import { validPartnerLogo } from '@/lib/partner-brand';
import { emptyPartner, normalizePartner, partnerReadiness } from '@/lib/partner-profile';
test('logos reject executable formats and oversized inline data',()=>{
  expect(validPartnerLogo('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
  expect(validPartnerLogo('javascript:alert(1)')).toBe(false);
  expect(validPartnerLogo('https://user:pass@example.com/logo.png')).toBe(false);
  expect(validPartnerLogo('data:image/png;base64,'+'a'.repeat(50000))).toBe(false);
  expect(validPartnerLogo('https://example.com/logo.png')).toBe(true);
});
test('extended fields roundtrip and existing regional information is not called missing',()=>{
  const p={...emptyPartner(),company:'검증',name:'담당자',phone:'01012345678',regions:[{province:'부산',district:'강서구'}],services:['보관'],temperatures:['상온'],logoUrl:'https://example.com/logo.png',introduction:'업체 소개',categories:['생활용품'],info:{cutoff:'오후 3시',wms:'WMS'},quoteEmail:'quote@example.com'};
  const {profile,errors}=normalizePartner(p,true);
  expect(errors).toEqual({});expect(profile.info?.cutoff).toBe('오후 3시');expect(profile.logoUrl).toBe(p.logoUrl);
  expect(partnerReadiness(profile)).toContain('운영 지역 1곳의 센터별 상세정보 연결');
});
