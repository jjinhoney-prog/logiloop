import { SectionTitle } from '@/components/ui';
import { hubs } from '@/lib/data';
import type { Listing } from '@/lib/types';
import { DistanceTable } from './distance-table';
import { KakaoMap } from './kakao-map';

export function LocationSection({ item }: { item: Listing }) {
  const warehouse = item.type === 'warehouse';
  return (
    <section className={`panel location-section ${warehouse ? 'location-warehouse' : 'location-partner'}`} aria-labelledby={`location-${item.id}`}>
      <span className="eyebrow">{warehouse ? 'SPACE ACCESS' : 'SERVICE HUB ACCESS'}</span>
      <div id={`location-${item.id}`}>
        <SectionTitle title={warehouse ? '창고 위치·접근성' : '물류사 운영 거점·접근성'} help="카카오모빌리티 경로 기준 추정치이며 시간대·차종(대형 화물차)에 따라 달라질 수 있습니다." />
      </div>
      <p className="location-note">권역 대표 위치이며 실제 {warehouse ? '매물' : '업체'} 위치가 아닙니다.</p>
      <KakaoMap origin={{ name: item.name, lat: item.lat, lng: item.lng }} hubs={hubs} />
      <DistanceTable listingId={item.id} hubNames={hubs.map((h) => h.name)} />
    </section>
  );
}
