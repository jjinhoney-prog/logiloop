import { beforeEach, describe, expect, test, vi } from 'vitest';
import { emptyPartner, normalizePartner } from '@/lib/partner-profile';
import { decodePartnerDocument, hashPartnerToken, PREFIX, redactPartnerNote, validPartnerAccess } from '@/lib/partner-document';

const mocks = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn(), write: vi.fn(), notify: vi.fn(), dbOn: true, auth: vi.fn() }));
vi.mock('@/lib/partner-store', () => ({ createPartner: mocks.create, readPartner: mocks.read, writePartner: mocks.write, PartnerConflict: class extends Error {} }));
vi.mock('@/lib/supabase', () => ({ isDbConfigured: () => mocks.dbOn }));
vi.mock('@/lib/partner-notification', () => ({ notifyPartnerRegistration: mocks.notify }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/auth', () => ({ assertAdmin: mocks.auth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const { POST: register } = await import('@/app/api/partnership/route');
const { POST: manage } = await import('@/app/api/partnership/manage/route');
const { partnerCreateLimiter, partnerManageLimiter } = await import('@/lib/partner-http');
const profile = { ...emptyPartner(), company: '테스트물류', name: '담당자', phone: '01012345678', regions: [{ province: '경남', district: '김해시' }, { province: '부산', district: '강서구' }], services: ['보관', '입출고'], temperatures: ['상온', '냉장'] };
const token = 'a'.repeat(64);
const doc = { profile, stage: '접수' as const, revision: 'revision-1', accessHash: hashPartnerToken(token), expiresAt: Date.now() + 60_000 };
const request = (body: unknown, path = 'partnership') => new Request(`http://localhost/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const access = { id: 21, token, action: 'load' };
beforeEach(() => { vi.clearAllMocks(); partnerCreateLimiter.reset(); partnerManageLimiter.reset(); mocks.dbOn = true; mocks.create.mockResolvedValue({ id: 21, token }); mocks.read.mockResolvedValue({ note: PREFIX + JSON.stringify(doc), doc }); mocks.write.mockResolvedValue({ profile, revision: 'revision-2', stage: '확인 중' }); });

describe('partner profile and access', () => {
  test('minimum registration keeps multiple regions, services and temperatures', () => { expect(normalizePartner(profile, true).errors).toEqual({}); expect(normalizePartner(profile, true).profile.centers).toEqual([]); });
  test('rejects missing required values, invalid choices and unsafe URLs', () => {
    const result = normalizePartner({ ...profile, company: '', phone: '12', services: ['invalid'], temperatures: [], regions: [], websiteUrl: 'javascript:alert(1)', documentUrl: 'https://user:pass@example.com' }, false);
    expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(['company', 'phone', 'services', 'temperatures', 'regions', 'websiteUrl', 'documentUrl', 'consent']));
  });
  test('bounds center payloads and requires center identity without requiring every facility detail', () => {
    expect(normalizePartner({ ...profile, centers: Array(11).fill({}) }, true).errors.centers).toBeDefined();
    const result = normalizePartner({ ...profile, centers: [{ name: '김해센터', address: '경남 김해시' }] }, true);
    expect(result.errors).toEqual({}); expect(result.profile.centers[0].spareCapacity).toBe('');
    expect(normalizePartner({ ...profile, centers: [{}] }, true).errors['centers.0.address']).toBeDefined();
  });
  test('links reject wrong tokens, malformed tokens and expiry', () => {
    expect(validPartnerAccess(doc, token)).toBe(true); expect(validPartnerAccess(doc, 'b'.repeat(64))).toBe(false);
    expect(validPartnerAccess(doc, 'a')).toBe(false); expect(validPartnerAccess(doc, token, doc.expiresAt)).toBe(false);
  });
  test('admin data has no hash or access secret; legacy notes remain readable', () => {
    const note = PREFIX + JSON.stringify(doc); expect(decodePartnerDocument(note)?.profile.company).toBe(profile.company);
    const redacted = redactPartnerNote(note); expect(JSON.stringify(redacted)).not.toContain(doc.accessHash); expect(JSON.stringify(redacted)).not.toContain('expiresAt');
    expect(redacted.partner?.profile).toEqual(profile); expect(redactPartnerNote('기존 파트너 상담')).toEqual({ note: '기존 파트너 상담' });
  });
});

describe('partner registration and private editing API', () => {
  test('persists a minimum registration and returns private access only after saving', async () => { const res = await register(request({ profile, consent: true })); expect(res.status).toBe(201); expect((await res.json()).id).toBe(21); expect(mocks.create).toHaveBeenCalledWith(profile); });
  test('rejects invalid data, bots and unavailable storage without false success', async () => {
    expect((await register(request({ profile, consent: false }))).status).toBe(400);
    expect((await register(request({ profile, consent: true, website: 'spam' }))).status).toBe(400);
    mocks.dbOn = false; expect((await register(request({ profile, consent: true }))).status).toBe(503); expect(mocks.create).not.toHaveBeenCalled();
  });
  test('enforces actual body size, not just content-length', async () => { expect((await register(request({ note: '가'.repeat(100_000) }))).status).toBe(413); expect(mocks.create).not.toHaveBeenCalled(); });
  test('rejects cross-origin requests and excessive registration attempts', async () => {
    const req = request({ profile, consent: true }); req.headers.set('origin', 'https://evil.example'); expect((await register(req)).status).toBe(403);
    await register(request({ profile, consent: true })); await register(request({ profile, consent: true })); expect((await register(request({ profile, consent: true }))).status).toBe(429);
  });
  test('cannot read another supplier by changing id without its token', async () => { mocks.read.mockResolvedValue({ note: '', doc: { ...doc, accessHash: hashPartnerToken('b'.repeat(64)) } }); expect((await manage(request(access))).status).toBe(401); });
  test('load returns only profile, stage and revision', async () => { const res = await manage(request(access)); expect(res.status).toBe(200); expect(await res.json()).toEqual({ ok: true, profile, stage: '접수', revision: 'revision-1' }); });
  test('supplier cannot set review stage or overwrite stale changes', async () => {
    expect((await manage(request({ ...access, action: 'save', profile, revision: 'stale' }))).status).toBe(409); expect(mocks.write).not.toHaveBeenCalled();
    expect((await manage(request({ ...access, action: 'save', profile, revision: doc.revision, stage: '등록 준비 완료' }))).status).toBe(200);
    expect(mocks.write.mock.calls[0][3]).toBe('확인 중');
  });
  test('database error does not expose credentials or database internals', async () => { mocks.read.mockRejectedValue(new Error('SECRET DB DETAIL')); const res = await manage(request(access)); expect(res.status).toBe(502); expect(JSON.stringify(await res.json())).not.toContain('SECRET'); });
});

test('partner registration does not activate the public partners navigation entry', async () => {
  const { isActive, currentLabel } = await import('@/components/shell/nav');
  expect(isActive('/partners', '/partnership')).toBe(false);
  expect(isActive('/partners', '/partners/example')).toBe(true);
  expect(currentLabel('/partnership')).toBe('3PL 업체 등록');
  expect(currentLabel('/partnership/manage')).toBe('업체 정보 보완');
});
