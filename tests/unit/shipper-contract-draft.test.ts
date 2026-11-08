import {describe,it,expect} from 'vitest';
import {buildShipperContractDraft} from '@/lib/shipper-contract-draft';
import {emptyQuoteResponse,emptyQuoteSpec,type QuoteView} from '@/lib/quotes';
const now=Date.parse('2026-11-02T00:00:00Z');
const quote:QuoteView={id:'q1',groupId:'g1',inquiryId:1,partnerId:2,partnerName:'테스트 물류',revision:'v1',createdAt:'2026-11-01',deliveryNote:'',state:'회신 완료',spec:{...emptyQuoteSpec(),item:'생활용품',temperature:'상온',start:'화주 희망 일정'},response:{...emptyQuoteResponse(),validUntil:'2026-11-03',rates:['0','','10','','',''],minimum:'0',vat:'별도',center:'김해',start:'업체 가능 일정'}};
describe('shipper contract preparation',()=>{
 it('preserves zero, missing amounts, provenance and differences in requested/replied dates',()=>{
  const d=buildShipperContractDraft({id:1,company:'테스트 화주'},quote,now);
  expect(d.body).toContain('단가 0원');expect(d.body).toContain('단가 [확인 필요]원');expect(d.body).toContain('견적 버전: v1');expect(d.body).toContain('요청 시작일: 화주 희망 일정');expect(d.body).toContain('업체 제안 시작일: 업체 가능 일정');
  expect(d.parties.map(p=>p.company)).toEqual(['테스트 화주','테스트 물류']);expect(d.parties.every(p=>!p.email&&!p.representative)).toBe(true);
 });
 it('rejects another inquiry, expired, unavailable and unanswered quotes',()=>{
  for(const q of [{...quote,inquiryId:3},{...quote,response:{...quote.response!,validUntil:'2026-11-01'}},{...quote,response:{...quote.response!,availability:'불가'}},{...quote,response:null}])expect(()=>buildShipperContractDraft({id:1,company:'화주'},q,now)).toThrow();
 });
 it('builds a blank draft with five annexes and no invented counterparty',()=>{
  const d=buildShipperContractDraft({id:1,company:'화주'});expect(d.parties[1].company).toBe('');expect(d.body.match(/별첨 [1-5]\./g)).toHaveLength(5);expect(d.body).toContain('합의 문안: [확인 필요]');
 });
});
