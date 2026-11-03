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
