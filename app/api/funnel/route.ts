import { funnelClientEvents, funnelPlacements, funnelVersion, validVisitId } from '@/lib/funnel';
import { recordFunnelEvent } from '@/lib/funnel-server';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!limiter.check(clientIp(request.headers))) return new Response(null, { status: 429 });
  if (Number(request.headers.get('content-length')) > 1024) return new Response(null, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 1024) return new Response(null, { status: 413 });
    const body = JSON.parse(text);
    if (!body || !validVisitId(body.visitId) || body.version !== funnelVersion || !funnelClientEvents.includes(body.event) || !funnelPlacements.includes(body.placement)) return new Response(null, { status: 400 });
    recordFunnelEvent(body.event, body.visitId, body.placement);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
