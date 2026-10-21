import { beforeEach, expect, test, vi } from 'vitest';
const query = vi.hoisted(() => ({ from: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ db: () => query, isDbConfigured: () => true }));
const { deleteListing } = await import('@/lib/listings');
beforeEach(() => {
  vi.clearAllMocks();
  query.from.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
});
test('deletes only the requested id and reports a missing record', async () => {
  query.select.mockResolvedValueOnce({ data: [{ id: 'test-01' }], error: null });
  expect(await deleteListing('test-01')).toBe('deleted');
  expect(query.from).toHaveBeenCalledWith('listings');
  expect(query.eq).toHaveBeenCalledWith('id', 'test-01');
  query.select.mockResolvedValueOnce({ data: [], error: null });
  expect(await deleteListing('test-01')).toBe('missing');
});
test('foreign key conflict protects consultation links', async () => {
  query.select.mockResolvedValue({ data: null, error: { code: '23503', message: 'foreign key constraint' } });
  expect(await deleteListing('test-01')).toBe('linked');
});
test('malformed id never reaches the database', async () => {
  expect(await deleteListing('*')).toBe('missing');
  expect(query.delete).not.toHaveBeenCalled();
});
