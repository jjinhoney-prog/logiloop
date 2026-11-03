'use client';

import { useEffect, useState } from 'react';
import type { PartnerView } from '@/lib/partner-profile';
import { PartnerProfileEditor } from './partner-form';

export default function PartnerManage() {
  const [credentials, setCredentials] = useState<{ id: number; token: string } | null>(null);
  const [view, setView] = useState<PartnerView | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const onHashChange = () => { setView(null); setCredentials(null); setError(''); setAttempt(value => value + 1); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const match = /^#([1-9]\d*)\.([a-f0-9]{64})$/.exec(window.location.hash);
      if (!match || !Number.isSafeInteger(Number(match[1]))) throw new Error('접수 완료 화면에서 보관한 보완 링크로 접속해 주세요. 링크를 분실했다면 로지루프 담당자에게 재발급을 요청해 주세요.');
      const auth = { id: Number(match[1]), token: match[2] };
      const response = await fetch('/api/partnership/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...auth, action: 'load' }), signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '정보를 불러오지 못했습니다.');
      return { auth, result };
    }
    load().then(({ auth, result }) => { if (!controller.signal.aborted) { setCredentials(auth); setView(result); } }).catch(err => { if (!controller.signal.aborted) setError(err.message === 'Failed to fetch' ? '연결이 끊겼습니다. 다시 시도해 주세요.' : err.message); });
    return () => controller.abort();
  }, [attempt]);
  return <div className="page partner-page"><header className="partner-heading"><h1>업체 정보 보완</h1><p>센터별 시설과 현재 수용 가능한 물량을 알려주세요.<br />저장한 내용은 담당자가 확인하며, 자동 공개되지 않습니다.</p></header>
    {error ? <div className="partner-error" role="alert"><p>{error}</p><button className="button button-outline" onClick={() => { setError(''); setView(null); setAttempt(x => x + 1); }}>다시 불러오기</button></div> : view && credentials ? <><p className="partner-review-state">접수번호 #{credentials.id} · 검토 상태: <strong>{view.stage}</strong></p><PartnerProfileEditor view={view} onSave={async (profile, revision) => {
      const response = await fetch('/api/partnership/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...credentials, action: 'save', profile, revision }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || '저장하지 못했습니다.'); setView(result); return result;
    }} /></> : <p role="status">업체 정보를 불러오는 중입니다.</p>}
  </div>;
}
