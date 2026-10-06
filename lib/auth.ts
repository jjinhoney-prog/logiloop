import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createRateLimiter } from './rate-limit';
import { createSessionToken, sessionSecretReady, SESSION_MAX_AGE_SECONDS, verifySessionToken } from './session';

const COOKIE = 'll_admin';

export const loginLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export function isAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD) && sessionSecretReady();
}

export async function startSession() {
  (await cookies()).set(COOKIE, createSessionToken(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: '/admin' });
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  return Boolean(token && verifySessionToken(token, Date.now()));
}

/** 관리자 페이지 렌더링 전에 호출. 로그인하지 않았으면 로그인 화면으로 보낸다. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}

/** 모든 관리자 Server Action의 첫 줄에서 호출. Server Action은 화면 없이도 직접 POST할 수 있다. */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}
