import { beforeEach, expect, test, vi } from 'vitest';
import { emptyPartner } from '@/lib/partner-profile';
import { hashPartnerToken, PREFIX, validPartnerAccess } from '@/lib/partner-document';
const state = vi.hoisted(() => ({ row: {} as Record<string, unknown> }));
vi.mock('@/lib/inquiries', () => ({ saveInquiry: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ db: () => ({ from: () => {
  let patch: Record<string, unknown> | undefined;
  const filters: [string, unknown][] = [];
  const chain = {
    select: () => chain,
    eq: (key: string, value: unknown) => { filters.push([key, value]); return chain; },
    update: (data: Record<string, unknown>) => { patch = data; return chain; },
    maybeSingle: async () => ({ data: filters.every(([key, value]) => state.row[key] === value) ? { ...state.row } : null, error: null }),
    then: (resolve: (value: { data: { id: unknown }[]; error: null }) => unknown) => {
      const matches = filters.every(([key, value]) => state.row[key] === value);
      if (matches && patch) Object.assign(state.row, patch);
      return Promise.resolve(resolve({ data: matches ? [{ id: state.row.id }] : [], error: null }));
    },
  };
  return chain;
} }) }));
const { readPartner, writePartner, rotatePartnerLink, PartnerConflict } = await import('@/lib/partner-store');
const profile = { ...emptyPartner(), company: '검증', name: '담당자', phone: '01012345678', regions: [{ province: '부산', district: '강서구' }], services: ['보관'], temperatures: ['상온'] };
const token = 'a'.repeat(64);
beforeEach(() => { state.row = { id: 1, kind: 'partnership', source: '3PL 간편 등록', updated_at: new Date().toISOString(), note: PREFIX + JSON.stringify({ profile, stage: '접수', revision: 'old-revision', accessHash: hashPartnerToken(token), expiresAt: Date.now() + 60_000 }) }; });
test('conditional update rejects a concurrent writer and preserves the newer profile', async () => {
  const first = await readPartner(1); const second = await readPartner(1);
  const saved = await writePartner(1, first!, { ...profile, company: '첫 수정' }, '확인 중');
  expect(saved.revision).not.toBe('old-revision');
  await expect(writePartner(1, second!, { ...profile, company: '유실되면 안 되는 충돌' }, '접수')).rejects.toBeInstanceOf(PartnerConflict);
  expect((await readPartner(1))?.doc.profile.company).toBe('첫 수정');
});
test('rotating access invalidates the old token without changing profile or review status', async () => {
  const result = await rotatePartnerLink(1);
  const current = (await readPartner(1))!.doc;
  expect(result.token).toMatch(/^[a-f0-9]{64}$/); expect(validPartnerAccess(current, token)).toBe(false); expect(validPartnerAccess(current, result.token)).toBe(true);
  expect(current.profile).toEqual(profile); expect(current.stage).toBe('접수'); expect(JSON.stringify(current)).not.toContain(result.token);
});
test('legacy inquiries cannot be treated as private access profiles', async () => { state.row.source = '직접 방문'; expect(await readPartner(1)).toBeNull(); });
test('supplier edits invalidate previous document review while preserving audit notes', async () => {
  const old=JSON.parse(String(state.row.note).slice(PREFIX.length));old.review={reviewer:'담당자',documents:'확인',checkedAt:'2026-01-01',notes:'이전 자료 확인'};state.row.note=PREFIX+JSON.stringify(old);
  const previous=await readPartner(1);await writePartner(1,previous!,{...profile,documentUrl:'https://example.com/new'},'확인 중');
  const doc=(await readPartner(1))!.doc;expect(doc.review?.documents).toBe('미확인');expect(doc.review?.notes).toContain('이전 자료 확인');
});
