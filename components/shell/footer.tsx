import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer>
      <div>
        <strong>로지루프</strong>
        <span>상담·비교·전환 지원 창구의 일원화</span>
      </div>
      <div>
        <Link href="/about">서비스·역할 안내</Link>
        <Link href="/privacy">개인정보 안내</Link>
        <Link href="/consultation">
          상담 준비
          <ArrowRight size={14} />
        </Link>
      </div>
    </footer>
  );
}
