import {partnerBody,partnerJson} from '@/lib/partner-http';
import {approvalAccess,patchPublication,readPublication} from '@/lib/request-store';
import {publicRequestView} from '@/lib/public-requests';
import {deadlinePassed} from '@/lib/quotes';
export async function POST(request:Request){
 const parsed=await partnerBody(request,'quote');if(parsed.response)return parsed.response;
 const {id,token,action,revision,consent}=parsed.body!;
 if(typeof id!=='string'||typeof token!=='string')return partnerJson({error:'확인 링크를 확인하세요.'},400);
 try{const row=await readPublication(id);if(!row||!approvalAccess(row,token))return partnerJson({error:'만료되었거나 사용할 수 없는 확인 링크입니다.'},403);
 if(action==='view')return partnerJson({view:publicRequestView(row),state:row.state,revision:row.revision});
 if(revision!==row.revision)return partnerJson({error:'요약이 변경되었습니다. 다시 불러와 확인하세요.'},409);
 if(action==='approve'){
  if(consent!==true||row.state!=='draft'||deadlinePassed(row.snapshot.deadline))return partnerJson({error:'공개할 요약과 동의를 확인하세요.'},400);
  await patchPublication(row,{state:'approved',approved_at:new Date().toISOString()});
 }else if(action==='withdraw'){
  await patchPublication(row,{state:'withdrawn',approval_hash:null,approval_expires_at:null});
 }else return partnerJson({error:'요청을 확인하세요.'},400);
 return partnerJson({ok:true});
 }catch{return partnerJson({error:'처리하지 못했습니다. 다시 확인해 주세요.'},502);}
}
