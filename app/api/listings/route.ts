import { getPublicSummaries } from '@/lib/listings';

// 공개 매물 요약(id·이름·지역·유형·온도). 비교함 ID 검증과 WebMCP 도구에서 사용한다.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getPublicSummaries(), { headers: { 'Cache-Control': 'no-store' } });
}
