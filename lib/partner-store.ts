import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { db } from './supabase';
import { saveInquiry } from './inquiries';
import { type PartnerProfile, type PartnerStage } from './partner-profile';

import { PREFIX, LINK_TTL, type PartnerDocument, decodePartnerDocument, hashPartnerToken, partnerView } from './partner-document';
function newAccess() { const token = randomBytes(32).toString('hex'); return { token, accessHash: hashPartnerToken(token), expiresAt: Date.now() + LINK_TTL }; }
const serialize = (doc: PartnerDocument) => PREFIX + JSON.stringify(doc);

export async function createPartner(profile: PartnerProfile) {
  const { token, ...access } = newAccess();
  const doc: PartnerDocument = { profile, stage: '접수', revision: randomUUID(), ...access };
  const id = await saveInquiry({
    partnership: true, targetIds: [], targetNames: [],
    data: { tier: 1, help: '물류사 서비스 소개', company: profile.company, name: profile.name, phone: profile.phone,
      region: profile.regions[0].province, regionDetail: profile.regions.map(r => `${r.province} ${r.district}`).join(', '),
      temperature: profile.temperatures.join(', '), item: '미정', volume: '상세정보 보완 전', timing: '확인 필요',
      source: '3PL 간편 등록', consent: true, note: serialize(doc) },
  }, new Date());
  return { id, token, ...partnerView(doc) };
}

export async function readPartner(id: number) {
  const { data, error } = await db().from('inquiries').select('id,note,updated_at').eq('id', id).eq('kind', 'partnership').eq('source', '3PL 간편 등록').maybeSingle();
  if (error) throw new Error('업체 정보를 불러오지 못했습니다.');
  if (!data) return null;
  const doc = decodePartnerDocument(data.note);
  return doc ? { updatedAt: data.updated_at as string, doc } : null;
}
export class PartnerConflict extends Error {}
/** Compare-and-swap protects supplier edits, admin status and token rotation from lost updates. */
export async function writePartner(id: number, previous: Awaited<ReturnType<typeof readPartner>> & {}, profile: PartnerProfile, stage: PartnerStage, review?: import('./partner-profile').PartnerReview) {
  const doc: PartnerDocument = { ...previous.doc, profile, stage, ...(review ? {review} : previous.doc.review ? {review:{...previous.doc.review,documents:'미확인',notes:`업체 정보 변경으로 재검토 필요. 이전 검토: ${previous.doc.review.notes}`.slice(0,1000)}} : {}), revision: randomUUID() };
  const { data, error } = await db().from('inquiries').update({
    company: profile.company, name: profile.name, phone: profile.phone,
    region: profile.regions[0].province, region_detail: profile.regions.map(r => `${r.province} ${r.district}`).join(', '),
    temperature: profile.temperatures.join(', '), note: serialize(doc), updated_at: new Date(Math.max(Date.now(), Date.parse(previous.updatedAt) + 1)).toISOString(),
    stage: stage === '접수' ? '접수' : '검토 중', closed_at: null,
  }).eq('id', id).eq('kind', 'partnership').eq('updated_at', previous.updatedAt).select('id');
  if (error) throw new Error('업체 정보를 저장하지 못했습니다.');
  if (!data?.length) throw new PartnerConflict('다른 곳에서 정보가 변경되었습니다. 최신 정보를 다시 불러온 뒤 수정해 주세요.');
  return partnerView(doc);
}
export async function rotatePartnerLink(id: number) {
  const previous = await readPartner(id);
  if (!previous) throw new Error('간편 등록된 업체를 찾을 수 없습니다.');
  const { token, ...access } = newAccess();
  const doc = { ...previous.doc, ...access, revision: randomUUID() };
  const { data, error } = await db().from('inquiries').update({ note: serialize(doc), updated_at: new Date(Math.max(Date.now(), Date.parse(previous.updatedAt) + 1)).toISOString() }).eq('id', id).eq('kind', 'partnership').eq('updated_at', previous.updatedAt).select('id');
  if (error || !data?.length) throw new Error('링크를 발급하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
  return { token, ...partnerView(doc) };
}
