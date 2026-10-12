import { funnelVersion, validVisitId, funnelClientEvents } from './funnel.ts';

type EventRow = { event: string; visitId: string; at: string; placement: string; version: string; environment: string };

export function parseFunnelLog(line: string): EventRow | null {
  try {
    let value = JSON.parse(line);
    if (typeof value.message === 'string') value = JSON.parse(value.message);
    if (value?.type !== 'logiloop_funnel' || value.version !== funnelVersion || value.environment !== 'production' || !validVisitId(value.visitId) || !Number.isFinite(Date.parse(value.at)) || ![...funnelClientEvents, 'request_submitted'].includes(value.event)) return null;
    return value;
  } catch {
    return null;
  }
}

/** 기간 내 홈 방문을 분모로 삼고, 그 방문과 연결된 이벤트만 센다. 재시도·새로고침은 중복 제거한다. */
export function summarizeFunnel(rows: EventRow[], from = -Infinity, to = Infinity) {
  const visits = new Map<string, number>();
  for (const row of rows) {
    if (row.event !== 'home_visit') continue;
    const time = Date.parse(row.at);
    if (!visits.has(row.visitId) || time < visits.get(row.visitId)!) visits.set(row.visitId, time);
  }
  const cohort = new Set([...visits].filter(([, at]) => at >= from && at < to).map(([id]) => id));
  const count = (event: string) => new Set(rows.filter((row) => row.event === event && cohort.has(row.visitId)).map((row) => row.visitId)).size;
  const homeVisits = cohort.size;
  const requestClicks = count('request_click');
  const requestStarts = count('request_started');
  const submissions = count('request_submitted');
  const rate = (value: number) => homeVisits ? Math.round(value / homeVisits * 10000) / 100 : null;
  return { version: funnelVersion, homeVisits, requestClicks, requestStarts, submissions, clickRatePercent: rate(requestClicks), submissionRatePercent: rate(submissions) };
}
