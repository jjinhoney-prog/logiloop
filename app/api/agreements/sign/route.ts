import {partnerBody,partnerJson} from '@/lib/partner-http';
import {agreementAccess,agreementSignerView,patchAgreement,readAgreement,signAgreement} from '@/lib/agreement-store';
export async function POST(request:Request){const parsed=await partnerBody(request,'quote');if(parsed.response)return parsed.response;const {id,index,token,action,revision,name,documentHash,consent}=parsed.body!;
 if(typeof id!=='string'||typeof token!=='string'||typeof index!=='number'||![0,1].includes(index))return partnerJson({error:'당사자 전용 링크를 확인하세요.'},400);
 try{const row=await readAgreement(id);if(!row||!agreementAccess(row,index,token))return partnerJson({error:'만료되었거나 취소된 서명 링크입니다.'},403);
 if(action==='view')return partnerJson({view:agreementSignerView(row,index)});
 if(action!=='sign'||typeof name!=='string'||typeof documentHash!=='string'||typeof consent!=='boolean')return partnerJson({error:'서명 내용을 확인하세요.'},400);
 if(revision!==row.revision)return partnerJson({error:'서명 상태가 변경되었습니다. 계약 다시 불러오기를 눌러 확인하세요.'},409);
 const patch=signAgreement(row,index,name,documentHash,consent);const updated=await patchAgreement(row,patch);return partnerJson({view:agreementSignerView(updated,index)});
 }catch(e){return partnerJson({error:e instanceof Error?e.message:'서명을 저장하지 못했습니다.'},400);}}
