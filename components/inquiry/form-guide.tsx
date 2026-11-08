import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

const partnerPoints = ['공개 가능한 시설·서비스 정보 정리', '정보 공개·홍보 범위 별도 협의', '특정 노출 순위·화주 수 보장 없음', '독점 계약을 기본 조건으로 요구하지 않음'];
const shipperPoints = ['요구조건 요약', '후보별 수용 확인 여부', '상담 범위에 맞춘 견적·비교 자료', '미확인 항목과 다음 확인 사항'];
const rentReviewPoints = ['현재 조건과 후보의 임차료·관리비 비교', '면적·입지·시설 조건의 차이', '이전비·원상복구비·추가 운송비 확인', '현재 창고 유지와 이전 대안 검토'];

export function FormGuide({ partnership, rentReview = false }: { partnership: boolean; rentReview?: boolean }) {
  return (
    <aside className="form-guide">
      <div className="eyebrow">WHAT YOU GET</div>
      <h2>{partnership ? '우리 시설과 서비스에\n맞는 요청을 검토합니다.' : rentReview ? '지금 내는 비용을 기준으로\n유지와 이전을 비교합니다.' : '한 번 정리한 조건으로\n필요한 만큼 비교합니다.'}</h2>
      <ul>
        {(partnership ? partnerPoints : rentReview ? rentReviewPoints : shipperPoints).map((t) => (
          <li key={t}>
            <Check size={16} />
            {t}
          </li>
        ))}
      </ul>
      <hr />
      <strong>비교를 넘어, 다음 선택까지.</strong>
      <p>로지루프는 요구조건 정리와 비교·전환을 지원합니다. 물류 운영은 계약한 물류사가, 공간 제공은 임대인이 담당합니다.</p>
      <Link href="/about">
        역할과 서비스 범위 보기
        <ArrowRight size={15} />
      </Link>
    </aside>
  );
}
