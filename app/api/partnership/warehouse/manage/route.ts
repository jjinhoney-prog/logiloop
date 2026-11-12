import { normalizeWarehouse } from '@/lib/warehouse-profile';
import { validPartnerAccess } from '@/lib/partner-document';
import { warehouseView } from '@/lib/warehouse-document';
import { readWarehouse, writeWarehouse } from '@/lib/warehouse-store';
import { PartnerConflict } from '@/lib/partner-store';
import { partnerBody, partnerJson } from '@/lib/partner-http';
import { isDbConfigured } from '@/lib/supabase';

// 보완 토큰은 요청 본문으로만 받는다. URL·공개 GET 응답에 넣지 않는다.
export async function POST(request: Request) {
  const parsed = await partnerBody(request, 'manage');
  if (parsed.response) return parsed.response;
  const body = parsed.body!;
  if (!Number.isSafeInteger(body.id) || Number(body.id) <= 0 || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return partnerJson({ error: '보완 링크를 확인해 주세요.' }, 401);
  if (!['load', 'save'].includes(String(body.action))) return partnerJson({ error: '요청 형식을 확인해 주세요.' }, 400);
  if (!isDbConfigured()) return partnerJson({ error: '현재 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  try {
    const previous = await readWarehouse(body.id as number);
    if (!previous || !validPartnerAccess(previous.doc, body.token)) return partnerJson({ error: '링크가 만료되었거나 유효하지 않습니다. 로지루프 담당자에게 새 보완 링크를 요청해 주세요.' }, 401);
    if (body.action === 'load') return partnerJson({ ok: true, ...warehouseView(previous.doc) });
    if (body.revision !== previous.doc.revision) return partnerJson({ error: '다른 곳에서 정보가 변경되었습니다. 입력 내용을 따로 보관한 뒤 최신 정보를 다시 불러와 주세요.' }, 409);
    const { profile, errors } = normalizeWarehouse(body.profile, true, false);
    if (Object.keys(errors).length) return partnerJson({ error: '입력 내용을 확인해 주세요.', fields: errors }, 400);
    // 등록자가 바꾸면 항상 다시 확인한다. 클라이언트가 보낸 검토 상태는 받지 않는다.
    // 내부 검토 메모·승인 기록은 등록자에게 돌려주지 않는다.
    const { profile: saved, stage, revision } = await writeWarehouse(body.id as number, previous, profile, '확인 중');
    return partnerJson({ ok: true, profile: saved, stage, revision });
  } catch (err) {
    return partnerJson({ error: err instanceof PartnerConflict ? err.message : '저장 또는 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, err instanceof PartnerConflict ? 409 : 502);
  }
}
