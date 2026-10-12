import { afterEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/funnel/route';
import { funnelVersion } from '@/lib/funnel';
import { parseFunnelLog, summarizeFunnel } from '@/lib/funnel-report';

const id = '7d6fa736-20ac-49f5-a5e0-28589f99a001';
const second = '7d6fa736-20ac-49f5-a5e0-28589f99a002';
const entry = (event: string, visitId = id, at = '2026-10-12T01:00:00Z') => ({ type: 'logiloop_funnel', version: funnelVersion, event, visitId, at, placement: 'hero', environment: 'production' });
afterEach(() => vi.restoreAllMocks());

describe('funnel events', () => {
  test('accepts allowlisted metrics without recording arbitrary fields', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const result = await POST(new Request('http://localhost/api/funnel', { method: 'POST', body: JSON.stringify({ ...entry('home_visit'), company: 'MUST NOT LOG' }) }));
    expect(result.status).toBe(204);
    expect(log.mock.calls[0][0]).not.toContain('MUST NOT LOG');
  });
  test('clients cannot fabricate accepted submissions or send cross-origin events', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    expect((await POST(new Request('http://localhost/api/funnel', { method: 'POST', body: JSON.stringify(entry('request_submitted')) }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/funnel', { method: 'POST', headers: { origin: 'https://other.example' }, body: JSON.stringify(entry('home_visit')) }))).status).toBe(403);
    expect(log).not.toHaveBeenCalled();
  });
  test('rejects bad identifiers and oversized payloads', async () => {
    expect((await POST(new Request('http://localhost/api/funnel', { method: 'POST', body: JSON.stringify(entry('home_visit', 'private-value')) }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/funnel', { method: 'POST', body: 'a'.repeat(1025) }))).status).toBe(413);
  });
});

describe('funnel report', () => {
  test('deduplicates retries and counts only accepted submissions linked to home visits', () => {
    const rows = [entry('home_visit'), entry('home_visit'), entry('request_click'), entry('request_click'), entry('request_started'), entry('request_submitted'), entry('request_submitted'), entry('home_visit', second), entry('request_submitted', '7d6fa736-20ac-49f5-a5e0-28589f99a003')];
    expect(summarizeFunnel(rows)).toMatchObject({ homeVisits: 2, requestClicks: 1, requestStarts: 1, submissions: 1, clickRatePercent: 50, submissionRatePercent: 50 });
  });
  test('cohorts follow home visit date, including a later submission for that visit', () => {
    const rows = [entry('home_visit'), entry('request_submitted', id, '2026-10-12T01:10:00Z'), entry('home_visit', second, '2026-10-11T23:55:00Z'), entry('request_submitted', second)];
    expect(summarizeFunnel(rows, Date.parse('2026-10-12T00:00:00Z'), Date.parse('2026-10-12T01:05:00Z'))).toMatchObject({ homeVisits: 1, submissions: 1 });
    expect(summarizeFunnel([]).submissionRatePercent).toBeNull();
  });
  test('parses direct and message-wrapped JSONL, excluding test environments', () => {
    expect(parseFunnelLog(JSON.stringify(entry('home_visit')))?.visitId).toBe(id);
    expect(parseFunnelLog(JSON.stringify({ message: JSON.stringify(entry('home_visit')) }))?.event).toBe('home_visit');
    expect(parseFunnelLog(JSON.stringify({ ...entry('home_visit'), environment: 'test' }))).toBeNull();
    expect(parseFunnelLog('server noise')).toBeNull();
  });
});
