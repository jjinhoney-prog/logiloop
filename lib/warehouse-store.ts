import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { db } from './supabase';
import { saveInquiry } from './inquiries';
import { hashPartnerToken, LINK_TTL } from './partner-document';
import { PartnerConflict } from './partner-store';
import type { PartnerReview, PartnerStage } from './partner-profile';
import { warehouseAreaLabel, type WarehouseProfile } from './warehouse-profile';
import { WAREHOUSE_PREFIX, WAREHOUSE_SOURCE, decodeWarehouseDocument, warehouseView, type WarehouseDocument } from './warehouse-document';

function newAccess() { const token = randomBytes(32).toString('hex'); return { token, accessHash: hashPartnerToken(token), expiresAt: Date.now() + LINK_TTL }; }
const serialize = (doc: WarehouseDocument) => WAREHOUSE_PREFIX + JSON.stringify(doc);
const regionDetail = (p: WarehouseProfile) => `${p.province} ${p.district}${p.dong ? ` ${p.dong}` : ''}`;
const nextUpdatedAt = (previous: string) => new Date(Math.max(Date.now(), Date.parse(previous) + 1)).toISOString();
type Stored = { updatedAt: string; doc: WarehouseDocument };

export async function createWarehouse(profile: WarehouseProfile) {
  const { token, ...access } = newAccess();
  const doc: WarehouseDocument = { profile, stage: '접수', revision: randomUUID(), ...access };
  const id = await saveInquiry({
    partnership: true, targetIds: [], targetNames: [],
    data: { tier: 1, help: '창고·물류센터 임대 홍보', company: profile.company, name: profile.name, phone: profile.phone,
      region: profile.province, regionDetail: regionDetail(profile), temperature: profile.temperatures.join(', '),
      item: profile.facilityType, volume: warehouseAreaLabel(profile) || profile.areaValue, timing: profile.availableAt || '확인 필요',
      source: WAREHOUSE_SOURCE, consent: true, note: serialize(doc) },
  }, new Date());
  return { id, token, ...warehouseView(doc) };
}

export async function readWarehouse(id: number): Promise<Stored | null> {
  const { data, error } = await db().from('inquiries').select('id,note,updated_at').eq('id', id).eq('kind', 'partnership').eq('source', WAREHOUSE_SOURCE).maybeSingle();
  if (error) throw new Error('창고 정보를 불러오지 못했습니다.');
  if (!data) return null;
  const doc = decodeWarehouseDocument(data.note);
  return doc ? { updatedAt: data.updated_at as string, doc } : null;
}

/** 버전 비교 저장. 등록자 수정·관리자 검토·링크 재발급이 서로 덮어쓰지 않게 한다. */
async function swap(id: number, previous: Stored, doc: WarehouseDocument, extra: Record<string, unknown>, conflict: string) {
  const { data, error } = await db().from('inquiries').update({ ...extra, note: serialize(doc), updated_at: nextUpdatedAt(previous.updatedAt) })
    .eq('id', id).eq('kind', 'partnership').eq('source', WAREHOUSE_SOURCE).eq('updated_at', previous.updatedAt).select('id');
  if (error) throw new Error('창고 정보를 저장하지 못했습니다.');
  if (!data?.length) throw new PartnerConflict(conflict);
}

export async function writeWarehouse(id: number, previous: Stored, profile: WarehouseProfile, stage: PartnerStage, review?: PartnerReview) {
  const carried = review ? { review } : previous.doc.review ? { review: { ...previous.doc.review, documents: '미확인', notes: `등록 정보 변경으로 재검토 필요. 이전 검토: ${previous.doc.review.notes}`.slice(0, 1000) } } : {};
  const doc: WarehouseDocument = { ...previous.doc, profile, stage, ...carried, revision: randomUUID() };
  await swap(id, previous, doc, {
    company: profile.company, name: profile.name, phone: profile.phone, region: profile.province, region_detail: regionDetail(profile),
    temperature: profile.temperatures.join(', '), item: profile.facilityType, volume: warehouseAreaLabel(profile) || profile.areaValue,
    timing: profile.availableAt || '확인 필요', stage: stage === '접수' ? '접수' : '검토 중', closed_at: null,
  }, '다른 곳에서 정보가 변경되었습니다. 최신 정보를 다시 불러온 뒤 수정해 주세요.');
  return { ...warehouseView(doc), review: doc.review, approval: doc.approval };
}

/** 승인 직전에 읽은 revision 그대로일 때만 승인 기록을 남긴다. */
export async function markWarehouseApproved(id: number, previous: Stored, profile: WarehouseProfile, listingId: string) {
  const revision = randomUUID();
  const doc: WarehouseDocument = { ...previous.doc, profile, stage: '등록 준비 완료', revision, approval: { revision, at: new Date().toISOString(), listingId } };
  await swap(id, previous, doc, { stage: '검토 중' }, '승인 중에 등록 정보가 바뀌었습니다. 새로고침 후 다시 승인해 주세요.');
  return { ...warehouseView(doc), review: doc.review, approval: doc.approval };
}

export async function rotateWarehouseLink(id: number) {
  const previous = await readWarehouse(id);
  if (!previous) throw new Error('온라인으로 등록된 창고를 찾을 수 없습니다.');
  const { token, ...access } = newAccess();
  const revision = randomUUID();
  // 링크만 바꾼 것은 내용 변경이 아니므로 공개 중 상태를 유지한다.
  const approval = previous.doc.approval?.revision === previous.doc.revision ? { ...previous.doc.approval, revision } : previous.doc.approval;
  const doc = { ...previous.doc, ...access, revision, ...(approval ? { approval } : {}) };
  try { await swap(id, previous, doc, {}, '링크를 발급하지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }
  catch { throw new Error('링크를 발급하지 못했습니다. 새로고침 후 다시 시도해 주세요.'); }
  return { token, ...warehouseView(doc), review: doc.review, approval: doc.approval };
}
