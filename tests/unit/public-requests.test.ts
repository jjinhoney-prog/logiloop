import {expect,test} from 'vitest';
import {normalizePublication,publicRequestView,isRecruiting,normalizeInterest} from '../../lib/public-requests';
const summary={title:'식품 냉장 보관 요청',region:'경남',category:'식품',temperature:'냉장',services:['보관'],storage:'10~30 PLT',outbound:'월 100~300 주문건',start:'일정 협의',deadline:'2099-01-01',summary:'냉장 보관·출고 가능한 업체를 검토합니다.'};
test('public DTO is allowlisted and expired/withdrawn requests are unavailable',()=>{
 const row={id:'public-id',snapshot:normalizePublication(summary),state:'published',approved_at:'2026-01-01',updated_at:'2026-01-01',inquiry_id:1,approval_hash:'secret',privatePhone:'01012345678'};
 expect(isRecruiting(row)).toBe(true);expect(isRecruiting({...row,state:'withdrawn'})).toBe(false);
 expect(isRecruiting({...row,snapshot:{...row.snapshot,deadline:'2000-01-01'}})).toBe(false);
 expect(JSON.stringify(publicRequestView(row))).not.toContain('secret');expect(publicRequestView(row)).not.toHaveProperty('inquiry_id');
});
test('public summary rejects contact/address/link leaks and invalid calendar dates',()=>{
 for(const extra of [{summary:'전화 010-1234-5678'},{summary:'https://private.example.com'},{summary:'메일 a@example.com'},{region:'부산 강서구 신항북로 50'},{deadline:'2099-02-30'}])expect(()=>normalizePublication({...summary,...extra})).toThrow();
});
test('interest is a consented lead, never an authenticated partner id',()=>{
 expect(()=>normalizeInterest({company:'업체'})).toThrow();
 const v=normalizeInterest({company:'테스트 업체',name:'담당자',phone:'01012345678',email:'test@example.com',center:'김해 냉장센터',conditions:'확인 후 협의',consent:true,partnerId:12});
 expect(v).not.toHaveProperty('partnerId');
});
