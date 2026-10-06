'use client';

import { useActionState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { login, type LoginState } from '@/app/admin/actions';

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return (
    <form className="panel admin-login" action={action}>
      <span className="prepared-icon">
        <LockKeyhole size={28} />
      </span>
      <h2>관리자 로그인</h2>
      {!configured && <p className="field-error">관리자 비밀번호가 아직 설정되지 않았습니다. 환경변수 ADMIN_PASSWORD와 SESSION_SECRET을 등록해 주세요.</p>}
      <label className="form-field">
        <span>비밀번호</span>
        <input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state?.error} aria-describedby={state?.error ? 'login-error' : undefined} />
        {state?.error && (
          <small className="field-error" id="login-error" role="alert">
            {state.error}
          </small>
        )}
      </label>
      <button className="button button-dark" type="submit" disabled={pending || !configured}>
        {pending ? '확인 중…' : '로그인'}
      </button>
      <p className="muted small">로그인은 8시간 유지됩니다. 공용 PC에서는 사용 후 로그아웃해 주세요.</p>
    </form>
  );
}
