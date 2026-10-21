import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), remove: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth', () => ({ assertAdmin: mocks.auth, endSession: vi.fn(), isAuthConfigured: vi.fn(), loginLimiter: {}, startSession: vi.fn() }));
vi.mock('@/lib/listings', () => ({ deleteListing: mocks.remove, insertListing: vi.fn(), setListingVisibility: vi.fn(), updateListing: vi.fn() }));
vi.mock('@/lib/inquiries', () => ({ updateInquiry: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ isDbConfigured: () => true }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
const { removeListing } = await import('@/app/admin/actions');
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue(undefined); });
test('unauthenticated request cannot delete', async () => {
  mocks.auth.mockRejectedValue(new Error('Unauthorized'));
  await expect(removeListing('test-01')).rejects.toThrow('Unauthorized');
  expect(mocks.remove).not.toHaveBeenCalled();
});
test('invalid ids cannot delete', async () => {
  expect((await removeListing('../all')).ok).toBe(false);
  expect(mocks.remove).not.toHaveBeenCalled();
});
test('linked and already deleted listings report errors without invalidation', async () => {
  for (const status of ['linked', 'missing']) {
    mocks.remove.mockResolvedValue(status);
    expect((await removeListing('test-01')).ok).toBe(false);
  }
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
test('successful deletion refreshes admin and public detail views', async () => {
  mocks.remove.mockResolvedValue('deleted');
  expect(await removeListing('test-01')).toEqual({ ok: true });
  for (const path of ['/admin', '/compare', '/warehouses', '/partners', '/warehouses/test-01', '/partners/test-01']) expect(mocks.revalidate).toHaveBeenCalledWith(path);
});
test('database failures return a recoverable error', async () => {
  mocks.remove.mockRejectedValue(new Error('database error'));
  expect((await removeListing('test-01')).ok).toBe(false);
});
