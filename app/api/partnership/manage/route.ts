import { normalizePartner } from '@/lib/partner-profile';
import { partnerView, validPartnerAccess } from '@/lib/partner-document';
import { readPartner, writePartner, PartnerConflict } from '@/lib/partner-store';
import { partnerBody, partnerJson } from '@/lib/partner-http';
import { isDbConfigured } from '@/lib/supabase';

// Credentials are sent in the request body, never the URL or a public GET response.
export async function POST(request: Request) {
  const parsed = await partnerBody(request, 'manage');
  if (parsed.response) return parsed.response;
  const body = parsed.body!;
  if (!Number.isSafeInteger(body.id) || Number(body.id) <= 0 || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return partnerJson({ error: '보완 링크를 확인해 주세요.' }, 401);
  if (!['load', 'save'].includes(String(body.action))) return partnerJson({ error: '요청 형식을 확인해 주세요.' }, 400);
  if (!isDbConfigured()) return partnerJson({ error: '현재 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  try {
    const previous = await readPartner(body.id as number);
    if (!previous || !validPartnerAccess(previous.doc, body.token)) return partnerJson({ error: '링크가 만료되었거나 유효하지 않습니다. 로지루프 담당자에게 새 보완 링크를 요청해 주세요.' }, 401);
    if (body.action === 'load') return partnerJson({ ok: true, ...partnerView(previous.doc) });
    if (body.revision !== previous.doc.revision) return partnerJson({ error: '다른 곳에서 정보가 변경되었습니다. 입력 내용을 따로 보관한 뒤 최신 정보를 다시 불러와 주세요.' }, 409);
    const { profile, errors } = normalizePartner(body.profile, true, false);
    if (Object.keys(errors).length) return partnerJson({ error: '입력 내용을 확인해 주세요.', fields: errors }, 400);
    // Supplier changes always require a fresh review; never accept a client-provided stage.
    const view = await writePartner(body.id as number, previous, profile, '확인 중');
    return partnerJson({ ok: true, ...view });
  } catch (err) {
    return partnerJson({ error: err instanceof PartnerConflict ? err.message : '저장 또는 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, err instanceof PartnerConflict ? 409 : 502);
  }
}
