'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertAdmin, endSession, isAuthConfigured, loginLimiter, startSession } from '@/lib/auth';
import { inquiryStages } from '@/lib/data';
import { updateInquiry } from '@/lib/inquiries';
import { parseListingForm, type ListingFormErrors } from '@/lib/listing-form';
import { insertListing, setListingVisibility, updateListing } from '@/lib/listings';
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
  redirect('/admin');
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
  revalidatePath('/admin');
  redirect(originalId ? '/admin?tab=listings' : '/admin?tab=listings&created=1');
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const visibilities: Visibility[] = ['hidden', 'published', 'archived'];

export async function changeListingVisibility(id: string, visibility: Visibility): Promise<ActionResult> {
  await assertAdmin();
  if (!visibilities.includes(visibility)) return { ok: false, error: '알 수 없는 상태입니다.' };
  try {
    if (!(await setListingVisibility(id, visibility))) return { ok: false, error: '매물을 찾을 수 없습니다.' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '변경에 실패했습니다.' };
  }
  revalidatePath('/admin');
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
