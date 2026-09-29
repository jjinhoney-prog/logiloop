'use client';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="page empty-state">
      <h1>화면을 불러오지 못했습니다.</h1>
      <p>잠시 후 다시 시도해 주세요.</p>
      <button className="button button-dark" onClick={() => retry()}>
        다시 시도
      </button>
    </div>
  );
}
