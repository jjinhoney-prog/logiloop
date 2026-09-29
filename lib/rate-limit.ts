/**
 * 메모리 기반 고정 창(window) 요청 제한.
 * 서버 인스턴스마다 따로 세므로 여러 인스턴스가 뜨는 환경(Vercel 등)에서는 근사치다.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** 허용되면 true. 호출 자체가 1회로 기록된다. */
    check(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      // 오래된 키가 쌓이지 않도록 가끔 정리한다.
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return true;
    },
    reset() {
      hits.clear();
    },
  };
}

export function clientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim() || 'unknown';
}

/** 상담 접수 API: 같은 IP에서 1분에 3회까지 */
export const inquiryLimiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
