'use client';
import {useState} from 'react';
import {deadlinePassed, type QuoteView} from '@/lib/quotes';
import {buildShipperContractDraft, type ContractInquiry} from '@/lib/shipper-contract-draft';
import type {AgreementDocument} from '@/lib/agreements';
export default function ShipperContractBuilder({inquiry,quotes,hasContent,onApply}:{inquiry?:ContractInquiry;quotes:QuoteView[];hasContent:boolean;onApply:(doc:AgreementDocument)=>void}) {
 const [quoteId,setQuoteId]=useState(''),[replace,setReplace]=useState(false),[message,setMessage]=useState('');
 const candidates=quotes.filter(q=>q.inquiryId===inquiry?.id&&q.state==='회신 완료'&&q.response&&q.response.availability!=='불가'&&!deadlinePassed(q.response.validUntil));
 function apply(){if(!inquiry)return;try{if(quoteId&&!candidates.some(q=>q.id===quoteId))throw new Error('견적을 다시 선택하세요.');onApply(buildShipperContractDraft(inquiry,candidates.find(q=>q.id===quoteId)));setReplace(false);setMessage('본문과 부속서 초안을 채웠습니다. 당사자·미확정 항목을 검토하고 아래 저장 버튼을 누르세요.');}catch(e){setMessage(e instanceof Error?e.message:'초안을 만들지 못했습니다.');}}
 return <section className="panel" aria-label="화주 계약 초안 도우미"><h3>요청·견적으로 계약 초안 채우기</h3><p>상담을 먼저 선택하세요. 유효한 회신 견적을 선택하면 단가표와 운영명세를 함께 채웁니다. 금액 0원은 유지하고 미입력 값은 ‘확인 필요’로 표시합니다.</p>
 <label className="form-field"><span>계약에 참고할 업체 견적</span><select disabled={!inquiry} value={quoteId} onChange={e=>{setQuoteId(e.target.value);setMessage('');setReplace(false);}}><option value="">빈 계약 구성·부속서로 시작</option>{candidates.map(q=><option key={q.id} value={q.id}>{q.partnerName} · {q.id.slice(0,8)} · 유효 {q.response?.validUntil} · {q.response?.availability}</option>)}</select></label>
 {inquiry&&!candidates.length&&<p>이 상담에 유효한 회신 견적이 없습니다. 빈 양식으로 시작하거나 견적 관리에서 회신을 확인하세요.</p>}
 {hasContent&&<label className="quote-confirm"><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>현재 입력한 제목·유형·당사자·본문을 새 초안으로 바꿉니다.</label>}
 <button type="button" className="button button-outline" disabled={!inquiry||(hasContent&&!replace)} onClick={apply}>계약 구성·부속서 초안 채우기</button><p role="status">{message}</p></section>;
}
