import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { db } from './supabase';
import { hashPartnerToken } from './partner-document';
import { safeEqual } from './session';
import { readPartner } from './partner-store';
import { decodeShipperQuote } from './shipper-quote';
import { quoteView, type QuoteRow } from './quote-store';
import { baselineFrom, buildReport, emptySettings, REPORT_VALID_DAYS, type ReportPartner, type ReportSettings, type ShipperReply } from './quote-report';

export interface ReportRow {
  group_id: string; inquiry_id: number; settings: Partial<ReportSettings>; access_hash: string | null; expires_at: number | null;
  delivery_note: string; issued_at: string | null; sent_at: string | null; replies: ShipperReply[]; revision: string; created_at: string;
}
const missing = (code?: string) => code === 'PGRST205' || code === '42P01';
export const REPORT_SETUP_MESSAGE = '리포트 저장소 준비가 필요합니다. supabase/008_quote_reports.sql을 적용하세요.';
export const settingsOf = (r: ReportRow | null): ReportSettings => ({ ...emptySettings(), ...(r?.settings ?? {}) });

export async function listGroupQuotes(groupId: string) {
  const { data, error } = await db().from('quote_requests').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(20);
  if (error) throw new Error('견적 정보를 불러오지 못했습니다.');
  return data as QuoteRow[];
}
export async function readReport(groupId: string) {
  const { data, error } = await db().from('quote_reports').select('*').eq('group_id', groupId).maybeSingle();
  if (error) throw new Error(missing(error.code) ? REPORT_SETUP_MESSAGE : '리포트를 불러오지 못했습니다.');
  return data as ReportRow | null;
}
export async function createReport(groupId: string, inquiryId: number, settings: ReportSettings) {
  const { error } = await db().from('quote_reports').insert({ group_id: groupId, inquiry_id: inquiryId, settings, replies: [], revision: randomUUID() });
  if (error?.code === '23505') throw new Error('이미 만든 리포트입니다. 새로고침하세요.');
  if (error) throw new Error(missing(error.code) ? REPORT_SETUP_MESSAGE : '리포트를 저장하지 못했습니다.');
}
export class ReportConflict extends Error {}
export async function patchReport(previous: ReportRow, patch: Partial<ReportRow>) {
  const { data, error } = await db().from('quote_reports').update({ ...patch, revision: randomUUID(), updated_at: new Date().toISOString() }).eq('group_id', previous.group_id).eq('revision', previous.revision).select('*');
  if (error) throw new Error('리포트 저장에 실패했습니다.');
  if (!data?.length) throw new ReportConflict('다른 곳에서 변경했습니다. 새로고침 후 다시 시도하세요.');
  return data[0] as ReportRow;
}
export async function issueReportToken(previous: ReportRow) {
  const token = randomBytes(32).toString('hex');
  const row = await patchReport(previous, { access_hash: hashPartnerToken(token), expires_at: Date.now() + REPORT_VALID_DAYS * 86400000, issued_at: new Date().toISOString(), sent_at: null });
  return { row, token };
}
/** 담당자가 직접 전달을 기록한 뒤에만, 만료·종결 전까지 열람할 수 있다. */
export function canReadReport(r: ReportRow, token: string, now = Date.now()) {
  return /^[a-f0-9]{64}$/.test(token) && !!r.access_hash && !!r.sent_at && !!r.expires_at && r.expires_at > now && settingsOf(r).stage !== '종결' && safeEqual(r.access_hash, hashPartnerToken(token));
}
async function shipperBaseline(inquiryId: number) {
  const { data, error } = await db().from('inquiries').select('note').eq('id', inquiryId).maybeSingle();
  if (error || !data) return null;
  return baselineFrom(decodeShipperQuote((data as { note: string }).note)?.requirements);
}
async function partnersOf(ids: number[]) {
  const entries = await Promise.all([...new Set(ids)].map(async id => {
    const p = await readPartner(id).catch(() => null);
    if (!p) return [id, undefined] as const;
    const pr = p.doc.profile;
    const partner: ReportPartner = { regions: pr.regions.map(r => `${r.province} ${r.district}`), services: pr.services, temperatures: pr.temperatures, categories: pr.categories ?? [], metrics: pr.metrics, review: p.doc.review };
    return [id, partner] as const;
  }));
  return Object.fromEntries(entries) as Record<number, ReportPartner | undefined>;
}
/** 관리자 미리보기와 화주 열람이 같은 함수로 같은 금액을 만든다. */
export async function reportViewFor(groupId: string, report: ReportRow | null) {
  const rows = await listGroupQuotes(groupId);
  if (!rows.length) throw new Error('견적 묶음을 찾을 수 없습니다.');
  const quotes = rows.map(quoteView).map(q => ({ id: q.id, partnerId: q.partnerId, partnerName: q.partnerName, spec: q.spec, state: q.state, response: q.response }));
  return buildReport({ groupId, quotes, partners: await partnersOf(quotes.map(q => q.partnerId)), settings: settingsOf(report), baseline: await shipperBaseline(rows[0].inquiry_id), replies: report?.replies ?? [], issuedAt: report?.issued_at ?? new Date().toISOString(), expiresAt: report?.expires_at ?? null });
}
