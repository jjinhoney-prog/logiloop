import { describe, expect, test } from 'vitest';
import { formatLeaseReview, leaseNoteRemaining, leaseReviewFields, leaseReviewNote } from '@/lib/lease-review';
import { parseRequestContext } from '@/lib/search-params';

describe('current lease review', () => {
  test('uses the cost comparison tier and retains explicit zero versus unknown', () => {
    expect(parseRequestContext({ situation: 'rent-review' })).toMatchObject({ tier: 2, help: '지금 내는 창고 임차료를 줄이고 싶어요' });
    const text = formatLeaseReview({ rent: '1,000', management: '0', area: '500평', deposit: '', vat: 'unknown' });
    expect(text).toContain('현재 월 임차료 (만원/월): 1,000');
    expect(text).toContain('현재 월 관리비 (만원/월): 0');
    expect(text).toContain('현재 보증금 (만원): 확인 필요');
    expect(text).toContain('VAT 기준: 확인 필요');
  });

  test('bounds untrusted fields and notes within the existing storage limit', () => {
    const raw = Object.fromEntries(leaseReviewFields.map(({ key }) => [key, 'a'.repeat(3000)]));
    const note = leaseReviewNote(raw, 'b'.repeat(3000));
    expect(note.length).toBe(2000);
    expect(leaseNoteRemaining(raw)).toBeGreaterThan(1000);
    expect(note).toContain('현재 사용 면적 (㎡ 또는 평): ' + 'a'.repeat(40) + '\n');
    expect(formatLeaseReview({ location: { bad: true }, rent: 123 })).toContain('현재 월 임차료 (만원/월): 확인 필요');
    expect(formatLeaseReview(null)).toContain('현재 창고 소재지: 확인 필요');
  });
});
