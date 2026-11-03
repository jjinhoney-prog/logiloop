import { clientIp, createRateLimiter } from './rate-limit';
export const partnerCreateLimiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
export const quoteManageLimiter = createRateLimiter({ limit: 50, windowMs: 60_000 });
export const partnerManageLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });
export const partnerJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
export async function partnerBody(request: Request, mode: 'create' | 'manage' | 'quote') {
  if (!(mode === 'create' ? partnerCreateLimiter : mode === 'quote' ? quoteManageLimiter : partnerManageLimiter).check(clientIp(request.headers))) return { response: partnerJson({ error: '요청이 많습니다. 1분 뒤 다시 시도해 주세요.' }, 429) };
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return { response: partnerJson({ error: '요청 출처를 확인해 주세요.' }, 403) };
  const reader = request.body?.getReader();
  if (!reader) return { response: partnerJson({ error: '입력 내용을 확인해 주세요.' }, 400) };
  try {
    let size = 0; const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256 * 1024) { await reader.cancel(); return { response: partnerJson({ error: '입력 내용이 너무 깁니다.' }, 413) }; }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return { body: body as Record<string, unknown> };
  } catch { return { response: partnerJson({ error: '입력 형식을 확인해 주세요.' }, 400) }; }
}
