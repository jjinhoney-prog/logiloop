import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { db } from './supabase';
import { hashPartnerToken } from './partner-document';
import { safeEqual } from './session';
import { deadlineEnd, replyWindowClosed, replyWindowEnd, type QuoteView, type QuoteSpec, type QuoteResponse, type QuoteState } from './quotes';
export interface QuoteRow {
  id: string; group_id: string; inquiry_id: number; partner_id: number; partner_name: string;
  spec: QuoteSpec; state: QuoteState; response: QuoteResponse | null; revision: string;
  access_hash: string | null; expires_at: number | null; delivery_note: string;
  sent_at: string | null; replied_at: string | null; created_at: string;
}
export const quoteIdValid = (id: unknown): id is string => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
export function quoteView(r: QuoteRow): QuoteView {
  return { id:r.id,groupId:r.group_id,inquiryId:r.inquiry_id,partnerId:r.partner_id,partnerName:r.partner_name,spec:r.spec,state:r.state,response:r.response,revision:r.revision,createdAt:r.created_at,sentAt:r.sent_at ?? undefined,repliedAt:r.replied_at ?? undefined,deliveryNote:r.delivery_note };
}
export function supplierQuoteView(r: QuoteRow) {
  // 담당자 정리 원문·출처는 내부 기록이라 업체 화면에는 내려보내지 않는다.
  let response: QuoteResponse | null = null;
  if (r.response) { response = { ...r.response }; delete response.original; delete response.source; delete response.enteredAt; }
  return { id:r.id, partnerName:r.partner_name, spec:r.spec, response, revision:r.revision };
}
export function canReadQuote(r: QuoteRow, token: string, now = Date.now()) {
  return ['전달 완료','회신 완료'].includes(r.state) && /^[a-f0-9]{64}$/.test(token) && !!r.access_hash && !!r.expires_at && linkExpiry(r) > now && !replyWindowClosed(r.spec.deadline, now) && safeEqual(r.access_hash, hashPartnerToken(token));
}
/** 회신기한에 맞춰 만료되던 기존 링크도 기한 후 회신 기간까지 연다. 발급 후 30일 제한으로 먼저 끝나는 링크는 그대로 둔다. */
export function linkExpiry(r: Pick<QuoteRow,'expires_at'|'spec'>) {
  if (!r.expires_at) return 0;
  return r.expires_at === deadlineEnd(r.spec.deadline) ? replyWindowEnd(r.spec.deadline) : r.expires_at;
}
export async function listQuotes() {
  const {data,error} = await db().from('quote_requests').select('*').order('created_at',{ascending:false}).limit(500);
  if (error) throw new Error(error.code === 'PGRST205' || error.code === '42P01' ? '견적 저장소 준비가 필요합니다. supabase/005_quotes.sql을 적용하세요.' : '견적 목록을 불러오지 못했습니다.');
  return (data as QuoteRow[]).map(quoteView);
}
export async function readQuote(id: string) {
  const {data,error} = await db().from('quote_requests').select('*').eq('id',id).maybeSingle();
  if (error) throw new Error('견적 정보를 불러오지 못했습니다.');
  return data as QuoteRow | null;
}
export async function insertQuotes(groupId: string, inquiryId: number, partners: {id:number;company:string}[], spec: QuoteSpec) {
  const rows = partners.map(p => ({ id:randomUUID(),group_id:groupId,inquiry_id:inquiryId,partner_id:p.id,partner_name:p.company,spec,state:'초안',revision:randomUUID() }));
  const {error} = await db().from('quote_requests').insert(rows);
  if (error?.code === '23505') throw new Error('이미 생성한 요청입니다. 목록을 새로고침하세요.');
  if (error) throw new Error('견적 요청을 저장하지 못했습니다. 저장소 설정을 확인하세요.');
}
export class QuoteConflict extends Error {}
export async function patchQuote(previous: QuoteRow, patch: Partial<QuoteRow>) {
  const {data,error} = await db().from('quote_requests').update({...patch,revision:randomUUID()}).eq('id',previous.id).eq('revision',previous.revision).select('*');
  if (error) throw new Error('견적 저장에 실패했습니다.');
  if (!data?.length) throw new QuoteConflict('다른 곳에서 변경했습니다. 최신 정보를 다시 불러오세요.');
  return data[0] as QuoteRow;
}
export async function issueQuoteToken(previous: QuoteRow) {
  if (previous.state === '종결' || replyWindowClosed(previous.spec.deadline)) throw new Error('종결되었거나 기한 후 회신 기간까지 지난 요청입니다. 새 요청을 만드세요.');
  const token = randomBytes(32).toString('hex');
  const row = await patchQuote(previous, {access_hash:hashPartnerToken(token), expires_at:Math.min(Date.now()+30*86400000,replyWindowEnd(previous.spec.deadline)),state:'전달 준비'});
  return {...quoteView(row),token};
}
