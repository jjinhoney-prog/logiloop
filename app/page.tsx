import Home from '@/components/home/home';
import { getPublicListings } from '@/lib/listings';

// 매물은 요청마다 DB에서 읽는다. 관리자 화면의 변경이 바로 반영된다.
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Home listings={(await getPublicListings()).slice(0, 3)} />;
}
