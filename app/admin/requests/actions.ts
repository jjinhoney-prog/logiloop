'use server';
import {assertAdmin} from '@/lib/auth';
import {getInquiries} from '@/lib/inquiries';
import {normalizePublication} from '@/lib/public-requests';
import {createPublication,patchPublication,readPublication} from '@/lib/request-store';
import {deadlinePassed} from '@/lib/quotes';
import {revalidatePath} from 'next/cache';
export async function draftPublication(inquiryId:number,input:unknown){await assertAdmin();try{
 const inquiry=(await getInquiries()).find(r=>r.id===inquiryId&&r.kind==='consultation');
 if(!inquiry?.shipperQuote?.publicConsent)throw new Error('이 화주는 익명 공개 검토를 신청하지 않았습니다. 별도 의사를 먼저 확인하세요.');
 const snapshot=normalizePublication(input);if(deadlinePassed(snapshot.deadline))throw new Error('마감일은 오늘 이후로 지정하세요.');
 const result=await createPublication(inquiryId,snapshot);revalidatePath('/admin/requests');return {ok:true as const,...result};
 }catch(err){return {ok:false as const,error:err instanceof Error?err.message:'저장하지 못했습니다.'};}}
export async function publicationState(id:string,revision:string,action:'publish'|'close'|'withdraw'){
 await assertAdmin();try{const row=await readPublication(id);if(!row||row.revision!==revision)throw new Error('새로고침 후 다시 확인하세요.');
 if(action==='publish'&&(row.state!=='approved'||!row.approved_at||deadlinePassed(row.snapshot.deadline)))throw new Error('화주가 승인한 유효한 요약만 공개할 수 있습니다.');
 if(!['publish','close','withdraw'].includes(action))throw new Error('동작을 확인하세요.');
 await patchPublication(row,{state:action==='publish'?'published':action==='close'?'closed':'withdrawn',...(action==='withdraw'?{approval_hash:null,approval_expires_at:null}:{})});
 revalidatePath('/admin/requests');revalidatePath('/requests');revalidatePath(`/requests/${id}`);return {ok:true as const};
 }catch(err){return {ok:false as const,error:err instanceof Error?err.message:'변경하지 못했습니다.'};}}
