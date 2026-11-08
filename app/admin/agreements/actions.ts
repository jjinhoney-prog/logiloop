'use server';
import {assertAdmin} from '@/lib/auth';
import {normalizeExternalAgreement} from '@/lib/external-agreement';
import {normalizeAgreement} from '@/lib/agreements';
import {createAgreement,issueAgreement,readAgreement,patchAgreement} from '@/lib/agreement-store';
import {getInquiries} from '@/lib/inquiries';
import {revalidatePath} from 'next/cache';
export async function agreementDraft(input:unknown,inquiryId:number|null){await assertAdmin();try{if(inquiryId!==null&&!(await getInquiries()).some(x=>x.id===inquiryId&&x.kind==='consultation'))throw new Error('연결할 상담을 확인하세요.');await createAgreement(normalizeAgreement(input),inquiryId);revalidatePath('/admin/agreements');return {ok:true as const};}catch(e){return {ok:false as const,error:e instanceof Error?e.message:'저장하지 못했습니다.'};}}
export async function agreementAction(id:string,revision:string,action:'issue'|'void',note:string){await assertAdmin();try{const row=await readAgreement(id);if(!row||row.revision!==revision)throw new Error('계약을 다시 불러오세요.');if(row.external_agreement)throw new Error('모두싸인 연결 계약은 모두싸인에서 처리 후 확인 상태를 기록하세요.');if(action==='issue'){const tokens=await issueAgreement(row,note);revalidatePath('/admin/agreements');return {ok:true as const,tokens};}if(action!=='void'||row.state==='completed'||row.state==='void')throw new Error('완료 계약은 원본을 유지하며 변경·해지는 별도 문서로 처리하세요.');await patchAgreement(row,{state:'void',access_hashes:[null,null],expires_at:null});revalidatePath('/admin/agreements');return {ok:true as const};}catch(e){return {ok:false as const,error:e instanceof Error?e.message:'처리하지 못했습니다.'};}}

export async function recordModusign(id:string,revision:string,input:unknown){
 await assertAdmin();
 try{
  const row=await readAgreement(id);
  if(!row||row.revision!==revision)throw new Error('계약 상태가 변경되었습니다. 다시 불러오세요.');
  if(row.state!=='draft'||row.signatures.some(Boolean))throw new Error('자체 서명이 시작된 계약은 전환할 수 없습니다. 별도 초안을 만드세요.');
  const external=normalizeExternalAgreement(input,row.external_agreement);
  await patchAgreement(row,{external_agreement:external,access_hashes:[null,null],expires_at:null});
  revalidatePath('/admin/agreements');return {ok:true as const};
 }catch(e){return {ok:false as const,error:e instanceof Error?e.message:'기록하지 못했습니다.'};}
}
