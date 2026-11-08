export const funnelVersion = 'focused-home-v1';
export const funnelClientEvents = ['home_visit', 'request_click', 'request_started'] as const;
export type FunnelEvent = (typeof funnelClientEvents)[number] | 'request_submitted';
export const funnelPlacements = ['hero', 'situation', 'bottom', 'navigation', 'form'] as const;
export type FunnelPlacement = (typeof funnelPlacements)[number];

export function validVisitId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

export function funnelContext(value: unknown): { visitId: string } | null {
  if (!value || typeof value !== 'object') return null;
  const visitId = (value as Record<string, unknown>).visitId;
  return validVisitId(visitId) ? { visitId } : null;
}
