import 'server-only';
import {randomBytes,randomUUID} from 'node:crypto';
import {db,isDbConfigured} from './supabase';
import {hashPartnerToken} from './partner-document';
import {safeEqual} from './session';
import {isRecruiting,publicRequestView,type Publication,type Interest} from './public-requests';
export interface PublicationRow {id:string;inquiry_id:number;snapshot:Publication;state:'draft'|'approved'|'published'|'closed'|'withdrawn';revision:string;approval_hash:string|null;approval_expires_at:number|null;approved_at:string|null;updated_at:string;created_at:string}
const COLUMNS='id,inquiry_id,snapshot,state,revision,approval_hash,approval_expires_at,approved_at,updated_at,created_at';
export const publicIdValid=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
const fail=()=>new Error('요청 저장소를 확인하세요. 006_public_requests.sql 적용이 필요합니다.');
export async function publicationRows(){if(!isDbConfigured())return [];const {data,error}=await db().from('request_publications').select(COLUMNS).order('created_at',{ascending:false}).limit(200);if(error)throw fail();return data as PublicationRow[];}
export async function readPublication(id:string){if(!publicIdValid(id)||!isDbConfigured())return null;const {data,error}=await db().from('request_publications').select(COLUMNS).eq('id',id).maybeSingle();if(error)throw fail();return data as PublicationRow|null;}
export async function publicRequests(){return (await publicationRows()).filter(r=>isRecruiting(r)).map(publicRequestView);}
export async function publicRequest(id:string){const r=await readPublication(id);return r&&isRecruiting(r)?publicRequestView(r):null;}
export async function createPublication(inquiryId:number,snapshot:Publication){
 const now=new Date().toISOString(),id=randomUUID();const token=randomBytes(32).toString('hex');
 const {error}=await db().from('request_publications').insert({id,inquiry_id:inquiryId,snapshot,state:'draft',revision:randomUUID(),approval_hash:hashPartnerToken(token),approval_expires_at:Date.now()+30*86400000,approved_at:null,created_at:now,updated_at:now});if(error)throw fail();return {id,token};
}
export async function patchPublication(row:PublicationRow,patch:Partial<PublicationRow>){const {data,error}=await db().from('request_publications').update({...patch,revision:randomUUID(),updated_at:new Date().toISOString()}).eq('id',row.id).eq('revision',row.revision).select(COLUMNS).maybeSingle();if(error)throw fail();if(!data)throw new Error('내용이 변경되었습니다. 새로고침 후 다시 시도하세요.');return data as PublicationRow;}
export function approvalAccess(row:PublicationRow,token:string){return /^[a-f0-9]{64}$/.test(token)&&!!row.approval_hash&&!!row.approval_expires_at&&row.approval_expires_at>Date.now()&&safeEqual(row.approval_hash,hashPartnerToken(token));}
export async function interestRows(){const {data,error}=await db().from('request_interests').select('id,publication_id,details,state,created_at').order('created_at',{ascending:false}).limit(200);if(error)throw fail();return data as {id:string;publication_id:string;details:Interest;state:string;created_at:string}[];}
export async function saveInterest(publicationId:string,id:string,details:Interest){const {error}=await db().from('request_interests').insert({id,publication_id:publicationId,details,state:'신원 확인 전'});if(error&&error.code!=='23505')throw fail();}
