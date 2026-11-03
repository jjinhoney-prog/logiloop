import {emptyAgreement, type AgreementDocument} from './agreements';
import {deadlinePassed, quoteItems, type QuoteView} from './quotes';
import {contractStandardUrl, shipperContractSections} from './shipper-contract-guide';
export type ContractInquiry = {id:number;company:string};
const value = (s:string|undefined) => s?.trim() || '[확인 필요]';
export function buildShipperContractDraft(inquiry:ContractInquiry, quote?:QuoteView, now=Date.now()):AgreementDocument {
 if(quote && (quote.inquiryId!==inquiry.id || quote.state!=='회신 완료' || !quote.response || quote.response.availability==='불가' || deadlinePassed(quote.response.validUntil,now))) throw new Error('이 상담의 유효한 회신 견적을 선택하세요.');
 const draft=emptyAgreement(),r=quote?.response,s=quote?.spec;
 draft.kind='물류대행';draft.title=`[검토용] ${inquiry.company} 물류업무 위수탁 계약`.slice(0,150);
 draft.parties[0].company=inquiry.company;draft.parties[1].company=quote?.partnerName??'';
 draft.body=[
  '물류업무 위수탁 계약 작성 초안 · 합의 및 검토 전',
  '아래 화주 요청·업체 회신은 협의 자료입니다. 확정 약정이 아니며 당사자 확인 후 문안을 작성하세요.',
  `연결 상담: #${inquiry.id}`,`견적 ID: ${quote?.id??'[확인 필요]'}`,`견적 버전: ${quote?.revision??'[확인 필요]'}`,`견적 회신일: ${quote?.repliedAt??'[확인 필요]'}`,`견적 유효기간: ${value(r?.validUntil)}`,
  `화주: ${value(inquiry.company)}`,`물류사: ${value(quote?.partnerName)}`,
  '',...shipperContractSections.map(([title,source,check],i)=>`${i+1}. ${title}\n작성 기준 (${source}): ${check}\n합의 문안: [확인 필요]`),
  '', '별첨 1. 단가표 · 업체 회신 기준 / 합의 확인 필요',
  ...quoteItems.map((item,i)=>`${item}: 수량 ${value(s?.quantities[i])} / 단위 ${value(s?.units[i])} / 단가 ${value(r?.rates[i])}원`),
  `월 최소요금: ${value(r?.minimum)}원`, `월 추가비: ${value(r?.extra)}원`, `초기비: ${value(r?.setup)}원`, `부가세: ${value(r?.vat)}`, '청구일·지급일·추가 작업 승인: [확인 필요]',
  '', '별첨 2. 운영명세서 · 요청과 회신 구분',
  `요청 품목: ${value(s?.item)}`,`요청 지역: ${value(s?.region)}`,`요청 온도: ${value(s?.temperature)}`,`요청 시작일: ${value(s?.start)}`,`SKU: ${value(s?.sku)}`,`피크 물량: ${value(s?.peak)}`,`요청 작업조건: ${value(s?.operations)}`,
  `업체 수용 여부: ${value(r?.availability)}`,`업체 제안 센터: ${value(r?.center)}`,`업체 제안 시작일: ${value(r?.start)}`,`업체 회신 조건: ${value(r?.note)}`,
  '', '별첨 3. 서비스 수준표(SLA)', '주문 마감·목표·측정 방법·예외·보고·개선 절차: [확인 필요]',
  '', '별첨 4. 재고·반품·사고 처리표', '재고실사·차이 조정·반품 판정·증빙·책임·보험·종료 인계: [확인 필요]',
  '', '별첨 5. 개인정보 처리위탁 약정 · 해당 시', '적용 여부·업무·재위탁·보호조치·반환/파기: [확인 필요]',
  '',`참고 양식: ${contractStandardUrl}`,'※ 변호사/세무사 검토 필요. 검토 완료 후 본문과 부속서 전체를 모두싸인에 업로드하세요.',
 ].join('\n\n');
 return draft;
}
