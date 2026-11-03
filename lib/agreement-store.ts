import 'server-only';
import type {ExternalAgreement} from './external-agreement';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {db} from './supabase';
import {hashPartnerToken} from './partner-document';
import {safeEqual} from './session';
import {type AgreementDocument,normalizeAgreement} from './agreements';
export interface AgreementSignature {name:string;signedAt:string;documentHash:string;consentVersion:'LOGILOOP_SIGN_V1'}
export interface AgreementRow {external_agreement?:ExternalAgreement|null;id:string;inquiry_id:number|null;document:AgreementDocument;document_hash:string;state:'draft'|'sent'|'completed'|'void';revision:string;signatures:[AgreementSignature|null,AgreementSignature|null];access_hashes:[string|null,string|null];expires_at:number|null;verification_note:string;created_at:string;updated_at:string}
export function agreementHash(document:AgreementDocument){return createHash('sha256').update(JSON.stringify(normalizeAgreement(document))).digest('hex');}
export function agreementAccess(row:AgreementRow,index:number,token:string){return !row.external_agreement&&[0,1].includes(index)&&/^[a-f0-9]{64}$/.test(token)&&['sent','completed'].includes(row.state)&&!!row.expires_at&&row.expires_at>Date.now()&&!!row.access_hashes[index]&&safeEqual(row.access_hashes[index]!,hashPartnerToken(token));}
export function agreementSignerView(row:AgreementRow,index:number){return {id:row.id,document:row.document,documentHash:row.document_hash,state:row.state,revision:row.revision,signatures:row.signatures,partyIndex:index};}
export function signAgreement(row:AgreementRow,index:number,name:string,hash:string,consent:boolean):Partial<AgreementRow>{
 if(row.external_agreement||![0,1].includes(index)||row.state!=='sent'||row.signatures[index]||hash!==row.document_hash||agreementHash(row.document)!==hash||consent!==true||name.trim()!==row.document.parties[index].representative)throw new Error('계약 버전·서명 권한·서명자 이름을 다시 확인하세요.');
 const signatures=[...row.signatures] as AgreementRow['signatures'];signatures[index]={name:name.trim(),signedAt:new Date().toISOString(),documentHash:hash,consentVersion:'LOGILOOP_SIGN_V1'};
 return {signatures,state:signatures.every(Boolean)?'completed':'sent'};
}
const failure=()=>new Error('전자계약 저장소를 확인하세요. 007_agreements.sql 및 009_external_agreements.sql 적용을 확인하세요.');
export async function listAgreements(){const {data,error}=await db().from('agreements').select('*').order('created_at',{ascending:false}).limit(100);if(error)throw failure();return data as AgreementRow[];}
export async function readAgreement(id:string){if(!/^[a-f0-9-]{36}$/.test(id))return null;const {data,error}=await db().from('agreements').select('*').eq('id',id).maybeSingle();if(error)throw failure();return data as AgreementRow|null;}
export async function createAgreement(document:AgreementDocument,inquiryId:number|null){const now=new Date().toISOString();const {error}=await db().from('agreements').insert({id:randomUUID(),document,document_hash:agreementHash(document),inquiry_id:inquiryId,state:'draft',revision:randomUUID(),signatures:[null,null],access_hashes:[null,null],expires_at:null,verification_note:'',created_at:now,updated_at:now});if(error)throw failure();}
export async function patchAgreement(row:AgreementRow,patch:Partial<AgreementRow>){const {data,error}=await db().from('agreements').update({...patch,revision:randomUUID(),updated_at:new Date().toISOString()}).eq('id',row.id).eq('revision',row.revision).select('*').maybeSingle();if(error)throw failure();if(!data)throw new Error('계약 상태가 변경되었습니다. 다시 불러오세요.');return data as AgreementRow;}
export async function issueAgreement(row:AgreementRow,note:string){if(row.external_agreement||row.state!=='draft'||note.trim().length<5||note.length>1000)throw new Error('초안의 문안 검토와 양 당사자 권한·수신처 확인 기록을 입력하세요.');const tokens=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex')];await patchAgreement(row,{state:'sent',verification_note:note.trim(),expires_at:Date.now()+30*86400000,access_hashes:tokens.map(hashPartnerToken) as [string,string]});return tokens;}
