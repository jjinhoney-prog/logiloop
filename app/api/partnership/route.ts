import { after } from 'next/server';
import { normalizePartner } from '@/lib/partner-profile';
import { createPartner } from '@/lib/partner-store';
import { partnerBody, partnerJson } from '@/lib/partner-http';
import { notifyPartnerRegistration } from '@/lib/partner-notification';
import { isDbConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  const parsed = await partnerBody(request, 'create');
  if (parsed.response) return parsed.response;
  const body = parsed.body!;
  if (body.website) return partnerJson({ error: '입력 내용을 확인해 주세요.' }, 400);
  const { profile, errors } = normalizePartner(body.profile, body.consent);
  if (Object.keys(errors).length) return partnerJson({ error: '입력 내용을 확인해 주세요.', fields: errors }, 400);
  if (!isDbConfigured()) return partnerJson({ error: '현재 온라인 등록을 준비 중입니다. 잠시 후 다시 이용해 주세요.' }, 503);
  try {
    const result = await createPartner(profile);
    after(() => notifyPartnerRegistration(result.id, profile));
    return partnerJson({ ok: true, ...result }, 201);
  } catch {
    return partnerJson({ error: '접수하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.' }, 502);
  }
}
