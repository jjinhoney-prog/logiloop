import {partnerCategories} from './partner-brand';
import {partnerServices,partnerTemperatures} from './partner-profile';
import {regionOptions} from './data';
import {deadlinePassed,validDate} from './quotes';
import {detailedAddress} from './public-partner';
export interface Publication {title:string;region:string;category:string;temperature:string;services:string[];storage:string;outbound:string;start:string;deadline:string;summary:string}
export interface PublicRequest {id:string;snapshot:Publication;updatedAt:string}
export const blankPublication=():Publication=>({title:'',region:'',category:'',temperature:'',services:[],storage:'협의 필요',outbound:'협의 필요',start:'협의 필요',deadline:'',summary:''});
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw new Error('입력 항목과 길이를 확인하세요.');return v.trim();};
export function normalizePublication(input:unknown):Publication {
 const v=record(input),p=blankPublication();
 for(const key of ['title','region','category','temperature','storage','outbound','start','deadline','summary'] as const){p[key]=text(v[key],key==='summary'?600:100);if(!p[key])throw new Error('익명 요약의 모든 항목을 입력하세요.');}
 if(!regionOptions.includes(p.region)||p.region==='아직 모름'||!partnerCategories.includes(p.category as typeof partnerCategories[number])||!partnerTemperatures.includes(p.temperature as typeof partnerTemperatures[number]))throw new Error('권역·품목·온도 분류를 선택하세요.');
 if(!validDate(p.deadline))throw new Error('모집 마감일을 확인하세요.');
 if(!Array.isArray(v.services)||!v.services.length||v.services.some(x=>!partnerServices.includes(x)))throw new Error('필요 업무를 선택하세요.');
 p.services=[...new Set(v.services)] as string[];
 const all=Object.values(p).flat().join(' ');
 if(/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:0\d{1,2})[\s.-]?\d{3,4}[\s.-]?\d{4}/i.test(all)||detailedAddress.test(all))throw new Error('연락처·자료 링크·상세 주소를 공개 요약에 넣지 마세요.');
 return p;
}
export function isRecruiting(row:{state:string;snapshot:Publication;approved_at?:string|null},now=Date.now()) {return row.state==='published'&&!!row.approved_at&&!deadlinePassed(row.snapshot.deadline,now);}
export function publicRequestView(row:{id:string;snapshot:Publication;updated_at:string}):PublicRequest {return {id:row.id,snapshot:normalizePublication(row.snapshot),updatedAt:row.updated_at};}
export interface Interest {company:string;name:string;phone:string;email:string;center:string;conditions:string;consent:true}
export function normalizeInterest(input:unknown):Interest {
 const v=record(input);const p={company:text(v.company,100),name:text(v.name,100),phone:text(v.phone,20),email:text(v.email,150),center:text(v.center,150),conditions:text(v.conditions,1000),consent:true as const};
 if(!p.company||!p.name||!p.center||!/^0\d{8,10}$/.test(p.phone.replace(/[\s-]/g,''))||!/^\S+@\S+\.\S+$/.test(p.email)||v.consent!==true)throw new Error('업체·담당자·연락처·이메일·가능 센터와 동의를 확인하세요.');return p;
}
