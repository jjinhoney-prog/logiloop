import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page empty-state">
      <span className="eyebrow">404 · NOT FOUND</span>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소를 확인하거나 상담 시작 화면으로 돌아가 주세요.</p>
      <Link className="button button-dark" href="/">
        상담 시작으로
      </Link>
    </div>
  );
}
