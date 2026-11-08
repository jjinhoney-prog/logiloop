import {partnerBody,partnerJson} from '@/lib/partner-http';
import {publicIdValid,publicRequest,saveInterest} from '@/lib/request-store';
import {normalizeInterest} from '@/lib/public-requests';
export async function POST(request:Request){
 const parsed=await partnerBody(request,'create');if(parsed.response)return parsed.response;
 const {requestId,id,details,website}=parsed.body!;
 if(website||!publicIdValid(requestId)||!publicIdValid(id))return partnerJson({error:'요청 정보를 확인하세요.'},400);
 let interest;try{interest=normalizeInterest(details);}catch(err){return partnerJson({error:err instanceof Error?err.message:'입력을 확인하세요.'},400);}
 try{if(!await publicRequest(requestId))return partnerJson({error:'모집이 마감되었거나 공개가 중단된 요청입니다.'},410);
 await saveInterest(requestId,id,interest);return partnerJson({ok:true},201);
 }catch{return partnerJson({error:'접수하지 못했습니다. 입력은 유지됩니다. 잠시 후 다시 시도하세요.'},502);}
}
