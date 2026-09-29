'use client';

import { useCallback, useRef, useState } from 'react';
import Script from 'next/script';
import { MapPinOff } from 'lucide-react';
import type { Hub } from '@/lib/types';

// 카카오맵 JavaScript 키는 앱 설정의 사이트 도메인으로 보호되므로 브라우저 노출(NEXT_PUBLIC_)을 허용한다.
const MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

type Status = 'loading' | 'ready' | 'unavailable';

function label(text: string, variant: 'origin' | 'hub') {
  const el = document.createElement('span');
  el.className = `map-label map-label-${variant}`;
  el.textContent = text;
  return el;
}

export function KakaoMap({ origin, hubs }: { origin: { name: string; lat: number; lng: number }; hubs: Hub[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(MAP_KEY ? 'loading' : 'unavailable');

  const init = useCallback(() => {
    const maps = window.kakao?.maps;
    if (!maps || !container.current) {
      setStatus('unavailable');
      return;
    }
    maps.load(() => {
      if (!container.current) return;
      const originPos = new maps.LatLng(origin.lat, origin.lng);
      const map = new maps.Map(container.current, { center: originPos, level: 9 });
      const bounds = new maps.LatLngBounds();
      new maps.Marker({ position: originPos, map, title: origin.name });
      new maps.CustomOverlay({ position: originPos, content: label('권역 대표 위치', 'origin'), map, yAnchor: 2.4 });
      bounds.extend(originPos);
      for (const hub of hubs) {
        const pos = new maps.LatLng(hub.lat, hub.lng);
        new maps.CustomOverlay({ position: pos, content: label(hub.name, 'hub'), map, yAnchor: 0.5 });
        bounds.extend(pos);
      }
      map.setBounds(bounds, 40, 40, 40, 40);
      setStatus('ready');
    });
  }, [origin, hubs]);

  if (!MAP_KEY || status === 'unavailable') {
    return (
      <div className="map-fallback" role="note">
        <MapPinOff size={26} />
        <strong>지도 설정 전</strong>
        <span>지도를 불러올 수 없습니다. 아래 거점별 거리표를 참고해 주세요.</span>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={init}
        onError={() => setStatus('unavailable')}
      />
      <div ref={container} className="kakao-map" role="img" aria-label={`${origin.name} 권역 대표 위치와 주요 물류 거점 지도`} aria-busy={status === 'loading'} />
    </>
  );
}
