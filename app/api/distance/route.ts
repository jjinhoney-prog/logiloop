import { findListing, hubs } from '@/lib/data';
import { DISTANCE_REVALIDATE_SECONDS, fetchHubDistances } from '@/lib/distance';

// 좌표를 직접 받지 않고 매물 ID로 서버에서 조회한다. 카카오 REST 키는 서버에서만 사용한다.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  const listing = findListing(id);
  if (!listing) {
    return Response.json({ ok: false, error: '매물을 찾을 수 없습니다.' }, { status: 404 });
  }

  const restKey = process.env.KAKAO_REST_KEY;
  if (!restKey) {
    return Response.json({ ok: false, error: '거리 계산 설정 전입니다.' }, { status: 503 });
  }

  const distances = await fetchHubDistances(listing, hubs, restKey);
  const allFailed = distances.every((d) => d.km === null);
  return Response.json(distances, {
    headers: {
      // 실패가 섞이면 짧게, 정상이면 하루 동안 CDN에 캐시한다.
      'Cache-Control': allFailed
        ? 'no-store'
        : distances.some((d) => d.km === null)
          ? 'public, s-maxage=600'
          : `public, s-maxage=${DISTANCE_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
    },
  });
}
