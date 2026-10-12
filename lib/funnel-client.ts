'use client';

import { funnelVersion, validVisitId, type FunnelEvent, type FunnelPlacement } from './funnel';

const storageKey = 'logiloop:home-visit';
const windowMs = 30 * 60 * 1000;
type Visit = { id: string; createdAt: number; version: string; announced?: boolean };
const pending = new Map<string, Promise<void>>();

function disabled() {
  return navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function visit(create = false): Visit | null {
  if (typeof window === 'undefined' || disabled()) return null;
  try {
    const raw = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (raw && raw.version === funnelVersion && validVisitId(raw.id) && typeof raw.createdAt === 'number' && Date.now() >= raw.createdAt && Date.now() - raw.createdAt < windowMs) return raw;
    if (!create) return null;
    const next = { id: crypto.randomUUID(), createdAt: Date.now(), version: funnelVersion };
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  } catch {
    // 저장소 차단 시 방문과 접수의 연결을 보장할 수 없으므로 측정하지 않는다.
    return null;
  }
}

async function send(event: Exclude<FunnelEvent, 'request_submitted'>, current: Visit, placement: FunnelPlacement) {
  try {
    const response = await fetch('/api/funnel', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ event, visitId: current.id, placement, version: funnelVersion }),
    });
    if (response.ok && event === 'home_visit') {
      const latest = visit();
      if (latest?.id === current.id) sessionStorage.setItem(storageKey, JSON.stringify({ ...latest, announced: true }));
    }
  } catch { /* 측정 실패는 이용 흐름에 영향을 주지 않는다. */ }
}

export function trackHomeVisit() {
  const current = visit(true);
  if (!current || current.announced || pending.has(current.id)) return;
  const request = send('home_visit', current, 'navigation').finally(() => pending.delete(current.id));
  pending.set(current.id, request);
}

export function trackHomeAction(event: 'request_click' | 'request_started', placement: FunnelPlacement) {
  const current = visit();
  if (current) void send(event, current, placement);
}

export function homeVisitContext() {
  const current = visit();
  return current ? { visitId: current.id } : undefined;
}
