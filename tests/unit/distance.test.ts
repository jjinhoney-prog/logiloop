import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GET } from '@/app/api/distance/route';
import { hubs } from '@/lib/data';
import { fetchHubDistance, toKmMinutes } from '@/lib/distance';

const ok = (distance: number, duration: number) =>
  new Response(JSON.stringify({ routes: [{ result_code: 0, summary: { distance, duration } }] }), { status: 200 });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('KAKAO_REST_KEY', 'test-rest-key');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const call = (id: string) => GET(new Request(`http://localhost/api/distance?id=${id}`));

describe('toKmMinutes', () => {
  test('meters → km with one decimal, seconds → rounded minutes', () => {
    expect(toKmMinutes(18_249, 1_499)).toEqual({ km: 18.2, minutes: 25 });
    expect(toKmMinutes(18_250, 1_470)).toEqual({ km: 18.3, minutes: 25 });
    expect(toKmMinutes(0, 29)).toEqual({ km: 0, minutes: 0 });
  });
});

describe('GET /api/distance', () => {
  test('returns one row per hub with km and minutes, sending lng,lat and KakaoAK header', async () => {
    fetchMock.mockImplementation(async () => ok(18_249, 1_499));
    const res = await call('busan-01');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(hubs.length);
    expect(body[0]).toEqual({ hub: '부산신항', km: 18.2, minutes: 25 });
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400');

    const [url, init] = fetchMock.mock.calls[0];
    const u = new URL(String(url));
    expect(u.origin + u.pathname).toBe('https://apis-navi.kakaomobility.com/v1/directions');
    expect(u.searchParams.get('origin')).toBe('128.834,35.0985');
    expect((init?.headers as Record<string, string>).Authorization).toBe('KakaoAK test-rest-key');
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(86_400);
  });

  test('missing key → 503 “거리 계산 설정 전”, no external call', async () => {
    vi.stubEnv('KAKAO_REST_KEY', '');
    const res = await call('busan-01');
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain('거리 계산 설정 전');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('unknown id → 404, no external call', async () => {
    const res = await call('nope');
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('partial failure marks only the failed hub as “확인 불가”', async () => {
    fetchMock.mockImplementation(async (input) => {
      const destination = new URL(String(input)).searchParams.get('destination');
      if (destination === `${hubs[1].lng},${hubs[1].lat}`) return new Response('err', { status: 500 });
      if (destination === `${hubs[2].lng},${hubs[2].lat}`) return new Response(JSON.stringify({ routes: [{ result_code: 104 }] }), { status: 200 });
      return ok(10_000, 600);
    });
    const body = await (await call('gimhae-01')).json();
    expect(body[0]).toEqual({ hub: '부산신항', km: 10, minutes: 10 });
    expect(body[1]).toEqual({ hub: '부산북항', km: null, minutes: null, note: '확인 불가' });
    expect(body[2]).toEqual({ hub: '김해공항', km: null, minutes: null, note: '확인 불가' });
  });

  test('network error on one hub does not fail the others', async () => {
    const result = await fetchHubDistance({ lat: 35, lng: 128 }, hubs[0], 'k', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));
    expect(result).toEqual({ hub: '부산신항', km: null, minutes: null, note: '확인 불가' });
  });

  test('all hubs failing is not cached', async () => {
    fetchMock.mockImplementation(async () => new Response('err', { status: 500 }));
    const res = await call('partner-01');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
