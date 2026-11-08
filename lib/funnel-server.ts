import 'server-only';
import { funnelVersion, type FunnelEvent, type FunnelPlacement } from './funnel';

/** 입력 내용·IP·전체 URL 없이, 집계에 필요한 허용 항목만 구조화 로그에 기록한다. */
export function recordFunnelEvent(event: FunnelEvent, visitId: string, placement: FunnelPlacement) {
  try {
    console.info(JSON.stringify({ type: 'logiloop_funnel', version: funnelVersion, event, visitId, placement, at: new Date().toISOString(), environment: process.env.NODE_ENV }));
  } catch { /* 통계 기록 실패가 접수 성공을 바꾸지 않도록 한다. */ }
}
