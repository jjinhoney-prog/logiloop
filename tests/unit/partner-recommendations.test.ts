import {expect,test} from 'vitest';
import {recommendPartners} from '@/lib/partner-recommendations';
import {emptyPartner} from '@/lib/partner-profile';
import {emptyShipperQuote} from '@/lib/shipper-quote';
import type {InquiryRecord} from '@/lib/types';
const shipper={id:1,region:'부산',regionDetail:'강서구',temperature:'냉장',item:'식품',volume:'20팔레트',shipperQuote:{...emptyShipperQuote(),category:'식품',services:['택배','포장']}} as InquiryRecord;
const partner=(id:number,patch={})=>({id,company:`물류${id}`,partner:{stage:'등록 준비 완료',revision:'1',profile:{...emptyPartner(),regions:[{province:'부산',district:'강서구'}],temperatures:['냉장'],categories:['식품'],services:['택배 출고','포장·임가공'],...patch}}}) as InquiryRecord;
test('shortlists three with evidence and unresolved capacity, maps service aliases',()=>{
 const r=recommendPartners(shipper,[partner(2),partner(3),partner(4),partner(5)]);
 expect(r.candidates.map(x=>x.id)).toEqual([2,3,4]);
 expect(r.candidates[0].reasons).toContain('택배 출고 제공 등록');
 expect(r.candidates[0].checks.join(' ')).toContain('동일 센터');
 expect(r.candidates[0].checks.join(' ')).toContain('여유량');
});
test('excludes explicit region/temperature conflict and held partners',()=>{
 const held=partner(4);held.partner!.stage='보류';
 const r=recommendPartners(shipper,[partner(2,{temperatures:['상온']}),partner(3,{regions:[{province:'경기',district:'용인'}]}),held]);
 expect(r.candidates).toHaveLength(0);expect(r.excluded).toBe(3);
});
test('missing supplier conditions remain unknown and rank below evidence',()=>{
 const r=recommendPartners(shipper,[partner(2,{temperatures:[],categories:[],services:[]}),partner(3)]);
 expect(r.candidates.map(x=>x.id)).toEqual([3,2]);
 expect(r.candidates[1].checks).toContain('요구 온도대 확인 필요');
});
test('empty or unstructured requirement cannot fabricate a recommendation',()=>{
 expect(recommendPartners(undefined,[partner(2)]).candidates).toEqual([]);
 expect(recommendPartners({...shipper,region:'',temperature:'',item:'',regionDetail:'',shipperQuote:undefined},[partner(2)]).candidates).toEqual([]);
});
test('compound temperatures are flagged for review, not declared matched',()=>{
 const r=recommendPartners({...shipper,temperature:'냉장·냉동'},[partner(2)]);
 expect(r.candidates[0].checks).toContain('요구 온도대 확인 필요');
 expect(r.candidates[0].reasons.some(x=>x.includes('냉장'))).toBe(false);
});
