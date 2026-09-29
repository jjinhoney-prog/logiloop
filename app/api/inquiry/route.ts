import { Resend } from 'resend';
import { buildEmailHtml, buildEmailText, buildSubject, isHoneypotFilled, normalizeInquiry } from '@/lib/inquiry-email';
import { clientIp, inquiryLimiter } from '@/lib/rate-limit';

// Resend 테스트 모드 발신 주소. 도메인 인증 후 교체한다.
const FROM = '로지루프 <onboarding@resend.dev>';
const MAX_BODY_BYTES = 16 * 1024;

type Result = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

const json = (body: Result, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  if (!inquiryLimiter.check(clientIp(request.headers))) {
    return json({ ok: false, error: '요청이 많습니다. 1분 뒤 다시 시도해 주세요.' }, 429);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  if (!apiKey || !to) {
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

  // 자동 입력(봇)은 성공처럼 응답하고 발송하지 않는다.
  if (isHoneypotFilled(body)) return json({ ok: true });

  const { value, errors } = normalizeInquiry(body);
  if (Object.keys(errors).length) {
    return json({ ok: false, error: '입력 내용을 확인해 주세요.', fields: errors as Record<string, string> }, 400);
  }

  const receivedAt = new Date();
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to: to.split(',').map((address) => address.trim()),
      subject: buildSubject(value),
      html: buildEmailHtml(value, receivedAt),
      text: buildEmailText(value, receivedAt),
    });
    if (error) {
      console.error('[inquiry] resend error', error.name, error.statusCode);
      return json({ ok: false, error: '메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
    }
  } catch (err) {
    console.error('[inquiry] resend request failed', err instanceof Error ? err.name : 'unknown');
    return json({ ok: false, error: '메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
  }

  return json({ ok: true });
}
