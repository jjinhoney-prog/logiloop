'use client';

import { useEffect, useState } from 'react';
import type { HubDistance } from '@/lib/types';

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; rows: HubDistance[] };

export function DistanceTable({ listingId, hubNames }: { listingId: string; hubNames: string[] }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/distance?id=${encodeURIComponent(listingId)}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(body)) throw new Error(body?.error || '거리 정보를 불러오지 못했습니다.');
        setState({ status: 'ready', rows: body });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : '거리 정보를 불러오지 못했습니다.' });
      });
    return () => controller.abort();
  }, [listingId]);

  const rows: HubDistance[] = state.status === 'ready' ? state.rows : hubNames.map((hub) => ({ hub, km: null, minutes: null }));

  return (
    // 좁은 화면에서 가로 스크롤되므로 키보드로도 스크롤할 수 있게 포커스를 허용한다.
    <div className="distance-table-wrap" tabIndex={0} role="region" aria-label="거점별 거리·소요 시간 표">
      <table className="distance-table">
        <caption className="sr-only">주요 물류 거점까지 차량 거리와 소요 시간</caption>
        <thead>
          <tr>
            <th scope="col">거점</th>
            <th scope="col">거리</th>
            <th scope="col">차량 소요</th>
            <th scope="col">비고</th>
          </tr>
        </thead>
        <tbody aria-busy={state.status === 'loading'}>
          {rows.map((row) => (
            <tr key={row.hub}>
              <th scope="row">{row.hub}</th>
              <td>{row.km === null ? '—' : `${row.km.toLocaleString('ko-KR')}km`}</td>
              <td>{row.minutes === null ? '—' : `약 ${row.minutes}분`}</td>
              <td>{state.status === 'loading' ? '계산 중' : state.status === 'error' ? state.message : (row.note ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
