import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// 쿠키·요청과 무관한 순수 함수만 둔다(단위 테스트 대상). 쿠키 처리는 lib/auth.ts.

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const MIN_SECRET_LENGTH = 32;

export function sessionSecretReady() {
  return (process.env.SESSION_SECRET ?? '').length >= MIN_SECRET_LENGTH;
}

const digest = (value: string) => createHash('sha256').update(value).digest();

/** 길이가 달라도 시간 차이가 나지 않도록 해시끼리 비교한다. */
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && safeEqual(input, password!);
}

// 서명 키에 비밀번호를 섞어, 비밀번호를 바꾸면 기존 세션이 모두 무효가 되게 한다.
function sign(payload: string) {
  return createHmac('sha256', `${process.env.SESSION_SECRET}\u0000${process.env.ADMIN_PASSWORD}`).update(payload).digest('base64url');
}

export function createSessionToken(now: number) {
  const expires = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string, now: number) {
  if (!sessionSecretReady() || !process.env.ADMIN_PASSWORD) return false;
  const [expires, signature, extra] = token.split('.');
  if (!expires || !signature || extra !== undefined || !/^\d{13}$/.test(expires)) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > now;
}
