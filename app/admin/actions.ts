'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertAdmin, endSession, isAuthConfigured, loginLimiter, startSession } from '@/lib/auth';
import { inquiryStages } from '@/lib/data';
import { updateInquiry } from '@/lib/inquiries';
import { parseListingForm, type ListingFormErrors } from '@/lib/listing-form';
import { deleteListing, insertListing, setListingVisibility, updateListing } from '@/lib/listings';
import { LISTING_ID_PATTERN } from '@/lib/logic';
import { clientIp } from '@/lib/rate-limit';
import { checkPassword } from '@/lib/session';
import { isDbConfigured } from '@/lib/supabase';
import type { InquiryStage, Visibility } from '@/lib/types';

// 모든 관리자 액션은 첫 줄에서 assertAdmin()으로 권한을 확인한다(로그인 제외).

export type LoginState = { error: string } | undefined;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) return { error: '관리자 비밀번호가 설정되지 않았습니다. ADMIN_PASSWORD와 SESSION_SECRET(32자 이상)을 등록해 주세요.' };
  if (!loginLimiter.check(clientIp(await headers()))) return { error: '시도 횟수가 많습니다. 10분 뒤 다시 시도해 주세요.' };
  if (!checkPassword(String(form.get('password') ?? ''))) return { error: '비밀번호가 맞지 않습니다.' };
  await startSession();
  redirect(form.get('next') === 'quotes' ? '/admin/quotes' : '/admin');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

export type ListingFormState = { error: string; fields?: ListingFormErrors } | undefined;

export async function saveListing(_prev: ListingFormState, form: FormData): Promise<ListingFormState> {
  await assertAdmin();
  if (!isDbConfigured()) return { error: 'DB 연결 전에는 매물을 저장할 수 없습니다.' };
  const originalId = String(form.get('originalId') ?? '');
  const { value, errors } = parseListingForm(form, { requireId: !originalId });
  if (Object.keys(errors).length) return { error: '입력 내용을 확인해 주세요.', fields: errors };
  try {
    if (originalId) {
      if (!(await updateListing(originalId, { ...value, id: originalId }))) return { error: '매물을 찾을 수 없습니다.' };
    } else if ((await insertListing(value)) === 'duplicate') {
      return { error: '입력 내용을 확인해 주세요.', fields: { id: '이미 사용 중인 ID입니다.' } };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '저장에 실패했습니다.' };
  }
  for (const path of ['/admin', '/partners', '/warehouses', '/compare', `/partners/${originalId || value.id}`, `/warehouses/${originalId || value.id}`]) revalidatePath(path);
  redirect(originalId ? '/admin?tab=listings' : '/admin?tab=listings&created=1');
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function removeListing(id: string): Promise<ActionResult> {
  await assertAdmin();
  if (typeof id !== 'string' || !LISTING_ID_PATTERN.test(id)) return { ok: false, error: '올바른 매물 ID가 아닙니다.' };
  if (!isDbConfigured()) return { ok: false, error: 'DB 연결 전에는 매물을 삭제할 수 없습니다.' };
  try {
    const result = await deleteListing(id);
    if (result === 'linked') return { ok: false, error: '상담 이력이 연결된 매물은 삭제할 수 없습니다. 비공개 또는 보관 처리해 주세요.' };
    if (result === 'missing') return { ok: false, error: '이미 삭제되었거나 매물을 찾을 수 없습니다.' };
  } catch {
    return { ok: false, error: '매물 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }
  for (const path of ['/admin', '/warehouses', '/partners', '/compare', `/warehouses/${id}`, `/partners/${id}`, `/admin/listings/${id}`]) revalidatePath(path);
  return { ok: true };
}

const visibilities: Visibility[] = ['hidden', 'published', 'archived'];

export async function changeListingVisibility(id: string, visibility: Visibility): Promise<ActionResult> {
  await assertAdmin();
  if (!visibilities.includes(visibility)) return { ok: false, error: '알 수 없는 상태입니다.' };
  try {
    if (!(await setListingVisibility(id, visibility))) return { ok: false, error: '매물을 찾을 수 없습니다.' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '변경에 실패했습니다.' };
  }
  for (const path of ['/admin', '/partners', '/warehouses', '/compare', `/partners/${id}`, `/warehouses/${id}`]) revalidatePath(path);
  return { ok: true };
}

export async function saveInquiryProgress(id: number, patch: { stage: InquiryStage; owner: string; nextAction: string }): Promise<ActionResult> {
  await assertAdmin();
  if (!Number.isSafeInteger(id) || !inquiryStages.includes(patch.stage)) return { ok: false, error: '입력 내용을 확인해 주세요.' };
  const owner = String(patch.owner ?? '').trim().slice(0, 40);
  const nextAction = String(patch.nextAction ?? '').trim().slice(0, 100);
  try {
    if (!(await updateInquiry(id, { stage: patch.stage, owner, nextAction }))) return { ok: false, error: '상담을 찾을 수 없습니다.' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '저장에 실패했습니다.' };
  }
  revalidatePath('/admin');
  return { ok: true };
}

export async function savePartnerReview(id: number, revision: string, profileInput: unknown, stage: import('@/lib/partner-profile').PartnerStage, reviewInput?: { reviewer: string; documents: string; notes: string }) {
  await assertAdmin();
  const { normalizePartner, partnerStages } = await import('@/lib/partner-profile');
  const { readPartner, writePartner } = await import('@/lib/partner-store');
  if (!Number.isSafeInteger(id) || id <= 0 || !partnerStages.includes(stage)) return { ok: false as const, error: '입력 내용을 확인해 주세요.' };
  const { profile, errors } = normalizePartner(profileInput, true, false);
  if (Object.keys(errors).length) return { ok: false as const, error: '입력 내용을 확인해 주세요.', fields: errors };
  try {
    const previous = await readPartner(id);
    if (!previous) return { ok: false as const, error: '업체를 찾을 수 없습니다.' };
    if (previous.doc.revision !== revision) return { ok: false as const, error: '정보가 변경되었습니다. 편집 창을 닫고 새로고침한 뒤 다시 확인해 주세요.' };
    let review;
    if (reviewInput !== undefined) {
      if (!reviewInput || typeof reviewInput.reviewer !== 'string' || typeof reviewInput.documents !== 'string' || typeof reviewInput.notes !== 'string' || reviewInput.reviewer.length > 100 || reviewInput.notes.length > 1000 || !['미확인','보완 요청','확인'].includes(reviewInput.documents)) return {ok:false as const,error:'자료 검토 정보를 확인하세요.'};
      if (reviewInput.documents === '확인' && !reviewInput.reviewer.trim()) return {ok:false as const,error:'자료 확인 담당자를 입력하세요.'};
      review = {...reviewInput,reviewer:reviewInput.reviewer.trim(),checkedAt:new Date().toISOString()};
    }
    const view = await writePartner(id, previous, profile, stage, review);
    revalidatePath('/admin');
    return { ok: true as const, ...view };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '저장하지 못했습니다.' }; }
}

export async function issuePartnerLink(id: number) {
  await assertAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false as const, error: '업체 번호를 확인해 주세요.' };
  try {
    const { rotatePartnerLink } = await import('@/lib/partner-store');
    const result = await rotatePartnerLink(id);
    revalidatePath('/admin');
    return { ok: true as const, ...result };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '발급하지 못했습니다.' }; }
}

/**
 * 업체가 저장한 최신 정보를 승인하고 3PL 목록에 공개한다. 처음이면 매물을 만들고,
 * 이미 공개 중이면 업체 입력 항목만 새로 반영한다. 비공개 매칭만 희망한 업체는 공개하지 않는다.
 */
export async function approvePartner(id: number, revision: string) {
  await assertAdmin();
  if (!Number.isSafeInteger(id) || id <= 0 || typeof revision !== 'string') return { ok: false as const, error: '업체 번호를 확인해 주세요.' };
  if (!isDbConfigured()) return { ok: false as const, error: 'DB 연결 전에는 공개할 수 없습니다.' };
  const { readPartner, markPartnerApproved } = await import('@/lib/partner-store');
  const { approvalListing, validateApprovalListing, PUBLIC_DISCLOSURE, PRIVATE_DISCLOSURE } = await import('@/lib/partner-approval');
  const { geocodeRegion } = await import('@/lib/geocode');
  const { getAdminListing } = await import('@/lib/listings');
  try {
    const previous = await readPartner(id);
    if (!previous) return { ok: false as const, error: '업체를 찾을 수 없습니다.' };
    if (previous.doc.revision !== revision) return { ok: false as const, error: '업체 정보가 바뀌었습니다. 새로고침한 뒤 최신 내용을 확인하고 승인해 주세요.' };
    const profile = previous.doc.profile;
    if (profile.disclosure === PRIVATE_DISCLOSURE) return { ok: false as const, error: '비공개 매칭만 희망한 업체입니다. 업체 동의를 받은 뒤 공개 희망 범위를 바꿔 저장해 주세요.' };
    const listingId = `registered-partner-${id}`;
    const existing = await getAdminListing(listingId);
    const first = profile.regions[0];
    const point = await geocodeRegion(`${first.province} ${first.district}`) ?? (existing ? { lat: existing.lat, lng: existing.lng } : null);
    if (!point) return { ok: false as const, error: `운영 지역(${first.province} ${first.district})의 위치를 찾지 못했습니다. 시·군·구 단위로 고쳐 저장하거나 매물 등록 화면에서 직접 만들어 주세요.` };
    const approvedProfile = { ...profile, disclosure: PUBLIC_DISCLOSURE };
    // 검증 단계에서 폼 항목만 다시 읽으므로 기존 매물의 visibility는 저장 값에 섞이지 않는다.
    const { value, errors } = validateApprovalListing(approvalListing(id, approvedProfile, point, existing));
    if (Object.keys(errors).length) return { ok: false as const, error: `공개 정보를 확인해 주세요: ${Object.values(errors).join(' ')}` };
    if (existing) { if (!(await updateListing(listingId, value))) return { ok: false as const, error: '매물을 찾을 수 없습니다.' }; }
    else if ((await insertListing(value)) === 'duplicate') return { ok: false as const, error: '같은 매물이 이미 있습니다. 새로고침 후 다시 시도해 주세요.' };
    await setListingVisibility(listingId, 'published');
    const view = await markPartnerApproved(id, previous, approvedProfile, listingId);
    for (const path of ['/admin', '/partners', '/compare', `/partners/${listingId}`]) revalidatePath(path);
    return { ok: true as const, ...view };
  } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : '공개하지 못했습니다.' }; }
}
