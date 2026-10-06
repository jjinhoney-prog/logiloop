import { Resend } from 'resend';
import { saveInquiry, setMailStatus } from '@/lib/inquiries';
import { buildEmailHtml, buildEmailText, buildSubject, isHoneypotFilled, normalizeInquiry, type NormalizedInquiry } from '@/lib/inquiry-email';
import { getPublicSummaries } from '@/lib/listings';
import { clientIp, inquiryLimiter } from '@/lib/rate-limit';
import { isDbConfigured } from '@/lib/supabase';

// Resend 테스트 모드 발신 주소. 도메인 인증 후 교체한다.
const FROM = '로지루프 <onboarding@resend.dev>';
const MAX_BODY_BYTES = 16 * 1024;

type Result = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

const json = (body: Result, status = 200) => Response.json(body, { status });

const SEND_FAILED = '메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';

async function sendMail(apiKey: string, to: string, inquiry: NormalizedInquiry, receivedAt: Date, inquiryId?: number): Promise<boolean> {
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to: to.split(',').map((address) => address.trim()),
      subject: buildSubject(inquiry),
      html: buildEmailHtml(inquiry, receivedAt, inquiryId),
      text: buildEmailText(inquiry, receivedAt, inquiryId),
    });
    if (error) {
      console.error('[inquiry] resend error', error.name, error.statusCode);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[inquiry] resend request failed', err instanceof Error ? err.name : 'unknown');
    return false;
  }
}

/**
 * 처리 순서: DB 저장 → 메일 발송 → 발송 결과 기록.
 * DB에 저장되면 메일이 실패해도 접수 성공이다. DB 저장이 실패하면 메일로라도 전달한다.
 */
export async function POST(request: Request) {
  if (!inquiryLimiter.check(clientIp(request.headers))) {
    return json({ ok: false, error: '요청이 많습니다. 1분 뒤 다시 시도해 주세요.' }, 429);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  const mailReady = Boolean(apiKey && to);
  const dbReady = isDbConfigured();
  if (!mailReady && !dbReady) {
    return json({ ok: false, error: '접수 설정 전입니다. 준비서를 내려받아 보관해 주세요.' }, 503);
  }

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: '입력 내용이 너무 깁니다.' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '요청 형식을 확인해 주세요.' }, 400);
  }

  // 자동 입력(봇)은 성공처럼 응답하고 저장·발송하지 않는다.
  if (isHoneypotFilled(body)) return json({ ok: true });

  let catalog: Awaited<ReturnType<typeof getPublicSummaries>> = [];
  try {
    catalog = await getPublicSummaries();
  } catch {
    // 후보 이름 확인에 실패해도 상담 본문은 접수한다.
  }

  const { value, errors } = normalizeInquiry(body, catalog);
  if (Object.keys(errors).length) {
    return json({ ok: false, error: '입력 내용을 확인해 주세요.', fields: errors as Record<string, string> }, 400);
  }

  const receivedAt = new Date();
  let inquiryId: number | undefined;
  if (dbReady) {
    try {
      inquiryId = await saveInquiry(value, receivedAt);
    } catch (err) {
      console.error('[inquiry] db save failed', err instanceof Error ? err.message : 'unknown');
    }
  }

  if (!mailReady) {
    if (inquiryId === undefined) return json({ ok: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
    await setMailStatus(inquiryId, 'skipped');
    return json({ ok: true });
  }

  const sent = await sendMail(apiKey!, to!, value, receivedAt, inquiryId);
  if (inquiryId !== undefined) {
    await setMailStatus(inquiryId, sent ? 'sent' : 'failed');
    return json({ ok: true });
  }
  return sent ? json({ ok: true }) : json({ ok: false, error: SEND_FAILED }, 502);
}
