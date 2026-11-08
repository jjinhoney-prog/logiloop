import { expect, test, vi } from 'vitest';
vi.mock('@/lib/supabase',()=>({db:()=>({})}));
import { canReadQuote, supplierQuoteView, type QuoteRow } from '@/lib/quote-store';
import { hashPartnerToken } from '@/lib/partner-document';
import { emptyQuoteSpec } from '@/lib/quotes';
const token='a'.repeat(64);
const row:QuoteRow={id:'11111111-1111-4111-8111-111111111111',group_id:'22222222-2222-4222-8222-222222222222',inquiry_id:12,partner_id:34,partner_name:'검증 업체',spec:{...emptyQuoteSpec(),deadline:'2099-01-01'},state:'전달 완료',response:null,revision:'r',access_hash:hashPartnerToken(token),expires_at:Date.parse('2099-01-01'),delivery_note:'내부 수신자',sent_at:null,replied_at:null,created_at:'2026-01-01'};
test('only delivered, unexpired, matching supplier capability can read',()=>{
  expect(canReadQuote(row,token)).toBe(true);
  expect(canReadQuote(row,'b'.repeat(64))).toBe(false);
  expect(canReadQuote({...row,state:'전달 준비'},token)).toBe(false);
  expect(canReadQuote({...row,state:'종결'},token)).toBe(false);
  expect(canReadQuote({...row,expires_at:1},token)).toBe(false);
  expect(canReadQuote({...row,spec:{...row.spec,deadline:'2000-01-01'}},token)).toBe(false);
});
test('supplier DTO excludes internal identity, delivery and credentials',()=>{
  const view=supplierQuoteView(row);
  for(const field of ['inquiry_id','partner_id','group_id','access_hash','expires_at','delivery_note'])expect(view).not.toHaveProperty(field);
});

test('late replies stay open for 7 days after the deadline, including links capped at the old deadline', async () => {
  const { deadlineEnd, replyWindowEnd, replyWindowLastDay } = await import('@/lib/quotes');
  const { linkExpiry } = await import('@/lib/quote-store');
  const spec = { ...emptyQuoteSpec(), deadline: '2026-11-05' };
  const legacy = { ...row, spec, expires_at: deadlineEnd('2026-11-05') };
  expect(linkExpiry(legacy)).toBe(replyWindowEnd('2026-11-05'));
  expect(replyWindowLastDay('2026-11-05')).toBe('2026-11-12');
  expect(canReadQuote(legacy, token, Date.parse('2026-11-08T03:00:00Z'))).toBe(true);
  expect(canReadQuote(legacy, token, Date.parse('2026-11-12T16:00:00Z'))).toBe(false);
  const short = { ...row, spec, expires_at: Date.parse('2026-11-01T00:00:00Z') };
  expect(canReadQuote(short, token, Date.parse('2026-11-03T00:00:00Z'))).toBe(false);
});

test('supplier view hides admin-only original and source', () => {
  const response = { availability: '가능', center: 'c', start: 's', rates: Array(6).fill('1'), minimum: '0', extra: '0', setup: '0', vat: '별도', validUntil: '2099-01-01', note: '', source: '담당자 정리' as const, original: '원문', enteredAt: 'x' };
  const view = supplierQuoteView({ ...row, response });
  expect(JSON.stringify(view)).not.toContain('원문');
  expect(view.response).not.toHaveProperty('source');
});
