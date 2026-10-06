import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn(function Resend() {
    return { emails: { send } };
  }),
}));

// DB는 연결 여부만 바꿔 가며 저장 함수를 mock 처리한다. 실제 Supabase는 호출하지 않는다.
const store = vi.hoisted(() => ({ dbOn: false, saveInquiry: vi.fn(), setMailStatus: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  isDbConfigured: () => store.dbOn,
  db: () => {
    throw new Error('no database in unit tests');
  },
}));
vi.mock('@/lib/inquiries', () => ({ saveInquiry: store.saveInquiry, setMailStatus: store.setMailStatus }));

const { POST } = await import('@/app/api/inquiry/route');
const { inquiryLimiter } = await import('@/lib/rate-limit');
const { buildEmailHtml, buildEmailText, buildSubject, escapeHtml, normalizeInquiry } = await import('@/lib/inquiry-email');
const { seedListings } = await import('@/lib/seed-listings');

const valid = {
  tier: 2,
  help: '',
  company: '예시 회사',
  name: '테스트',
  phone: '010-1234-5678',
  item: '생활용품',
  volume: '100PLT',
  region: '부산',
  regionDetail: '',
  timing: '3개월 이내',
  temperature: '상온',
  note: '',
  consent: true,
  source: '블로그',
  partnership: false,
  targets: ['busan-01'],
  website: '',
};

let ipCounter = 0;
function request(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request('http://localhost/api/inquiry', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  vi.stubEnv('INQUIRY_TO_EMAIL', 'owner@example.com');
  send.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
  inquiryLimiter.reset();
  store.dbOn = false;
  store.saveInquiry.mockReset().mockResolvedValue(42);
  store.setMailStatus.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/inquiry', () => {
  test('valid consultation is sent once with subject and table body', async () => {
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0][0];
    expect(payload.from).toBe('로지루프 <onboarding@resend.dev>');
    expect(payload.to).toEqual(['owner@example.com']);
    expect(payload.subject).toBe('[로지루프 상담] 2등급 조건 비교 · 부산 · 생활용품');
    expect(payload.html).toContain('부산 신항권 상온 물류창고');
    expect(payload.text).toContain('연락처: 010-1234-5678');
  });

  test('partnership subject uses type, region and company', async () => {
    await POST(request({ ...valid, partnership: true, help: '창고·물류센터 임대 홍보', item: '' }));
    expect(send.mock.calls[0][0].subject).toBe('[로지루프 파트너] 창고·물류센터 임대 홍보 · 부산 · 예시 회사');
  });

  test('missing required fields → 400 with field errors, no send', async () => {
    const res = await POST(request({ ...valid, company: ' ', item: '', consent: false }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.fields).sort()).toEqual(['company', 'consent', 'item']);
    expect(send).not.toHaveBeenCalled();
  });

  test('invalid phone → 400', async () => {
    const res = await POST(request({ ...valid, phone: '12345' }));
    expect(res.status).toBe(400);
    expect((await res.json()).fields.phone).toBeDefined();
    expect(send).not.toHaveBeenCalled();
  });

  test('honeypot filled → pretends success, no send', async () => {
    const res = await POST(request({ ...valid, website: 'http://spam.example' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  test('missing key → 503 “접수 설정 전”', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request(valid));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain('접수 설정 전');
    expect(send).not.toHaveBeenCalled();
  });

  test('more than 3 requests per minute from one IP → 429', async () => {
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await POST(request(valid, '203.0.113.9'))).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(send).toHaveBeenCalledTimes(3);
    expect((await POST(request(valid, '203.0.113.10'))).status).toBe(200);
  });

  test('malformed JSON → 400', async () => {
    expect((await POST(request('{not json'))).status).toBe(400);
  });

  test('provider error → 502 without leaking details', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'invalid_api_key', message: 'secret detail', statusCode: 401 } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(request(valid));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('secret detail');
  });
});

describe('POST /api/inquiry with database', () => {
  beforeEach(() => {
    store.dbOn = true;
  });

  test('saves first, then mails with the inquiry number and records “sent”', async () => {
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(store.saveInquiry).toHaveBeenCalledTimes(1);
    expect(store.saveInquiry.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]);
    expect(send.mock.calls[0][0].text).toContain('DB 접수번호 #42');
    expect(store.setMailStatus).toHaveBeenCalledWith(42, 'sent');
  });

  test('mail failure still succeeds because the inquiry is saved, and records “failed”', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'rate_limit', message: 'x', statusCode: 429 } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(store.setMailStatus).toHaveBeenCalledWith(42, 'failed');
  });

  test('database failure falls back to mail only', async () => {
    store.saveInquiry.mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(send.mock.calls[0][0].text).toContain('DB에 저장되지 않은 접수');
    expect(store.setMailStatus).not.toHaveBeenCalled();
  });

  test('database and mail both failing → 502', async () => {
    store.saveInquiry.mockRejectedValue(new Error('down'));
    send.mockRejectedValue(new Error('network'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await POST(request(valid))).status).toBe(502);
  });

  test('without mail keys the inquiry is saved and marked “skipped”', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
    expect(store.setMailStatus).toHaveBeenCalledWith(42, 'skipped');
  });

  test('invalid input is rejected before anything is saved', async () => {
    const res = await POST(request({ ...valid, phone: '1' }));
    expect(res.status).toBe(400);
    expect(store.saveInquiry).not.toHaveBeenCalled();
  });

  test('honeypot is not saved', async () => {
    await POST(request({ ...valid, website: 'spam' }));
    expect(store.saveInquiry).not.toHaveBeenCalled();
  });
});

describe('inquiry email helpers', () => {
  test('HTML is escaped against injection', () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;');
    const { value } = normalizeInquiry({ ...valid, note: '<img src=x onerror=alert(1)>' }, seedListings);
    const html = buildEmailHtml(value, new Date('2026-09-29T15:00:00Z'));
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  test('fields are trimmed to form limits and enums fall back to known options', () => {
    const { value } = normalizeInquiry({ ...valid, note: 'a'.repeat(5000), region: '화성', source: 'evil', targets: ['nope', 'busan-01', 'busan-01'] }, seedListings);
    expect(value.data.note).toHaveLength(2000);
    expect(value.data.region).toBe('아직 모름');
    expect(value.data.source).toBe('기타');
    expect(value.targetNames).toEqual(['부산 신항권 상온 물류창고']);
    expect(value.targetIds).toEqual(['busan-01']);
  });

  test('subject has no line breaks', () => {
    const { value } = normalizeInquiry({ ...valid, item: '생활\r\nBcc: x@y.z' }, seedListings);
    expect(buildSubject(value)).not.toMatch(/[\r\n]/);
  });

  test('mail footer says whether the inquiry was stored', () => {
    const { value } = normalizeInquiry(valid, seedListings);
    expect(buildEmailText(value, new Date(), 7)).toContain('DB 접수번호 #7');
    expect(buildEmailText(value, new Date())).toContain('DB에 저장되지 않은 접수');
  });

  test('received time is rendered in KST', () => {
    const { value } = normalizeInquiry(valid, seedListings);
    expect(buildEmailHtml(value, new Date('2026-09-29T15:00:00Z'))).toContain('2026. 09. 30. 00:00 (KST)');
  });
});
