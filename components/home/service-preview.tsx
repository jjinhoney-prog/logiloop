import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { serviceSteps } from '@/lib/service-content';
import { ComparisonTabs } from './comparison-tabs';

export function ServiceSteps() {
  return <ol className="service-steps">{serviceSteps.map((step, i) => (
    <li key={step.title}><span className="step-number">0{i + 1}</span><h3>{step.title}</h3><p>{step.description}</p><strong>{step.result}</strong></li>
  ))}</ol>;
}

export function ServicePreview({ compact = false }: { compact?: boolean }) {
  if (compact) return (
    <section id="comparison-preview" className="service-preview compact-preview" aria-labelledby="compact-preview-title">
      <span className="example-label">가상 예시 · 실제 업체·견적 아님</span>
      <h2 id="compact-preview-title">맡길 때도, 직접 운영할 때도. 판단할 조건을 한눈에.</h2>
      <p className="home-preview-description">후보 이름만 나열하지 않습니다. 필요한 업무와 비용, 추가로 확인할 조건을 함께 정리합니다.</p>
      <ComparisonTabs outsource={
        <div className="home-comparison">
          <h3>물류를 맡길 때 <span>물류사·3PL 비교</span></h3>
          <div className="preview-table-wrap" tabIndex={0} role="region" aria-label="가상 물류사 비교 예시">
            <table className="preview-table"><caption className="sr-only">물류사 후보별 업무 범위와 확인 사항 · 가상 예시</caption>
              <thead><tr><th scope="col">비교 항목</th><th scope="col">가상 후보 A</th><th scope="col">가상 후보 B</th></tr></thead>
              <tbody>
                <tr><th scope="row">보관·출고</th><td>상온 보관·박스 출고</td><td>냉장 보관·낱개 피킹</td></tr>
                <tr><th scope="row">비용 확인</th><td>보관료·박스당 출고비</td><td>보관료·피킹·포장비</td></tr>
                <tr><th scope="row">추가 확인</th><td>월 최소 물량</td><td>출고 마감·온도 관리</td></tr>
              </tbody>
            </table>
          </div>
          <p>품목·물량에 맞는 업무 범위를 확인하고 견적을 비교합니다.</p>
          <Link className="button button-dark comparison-request" data-funnel-placement="situation" href="/consultation?situation=outsource">물류사 찾기 요청<ArrowRight size={17} /></Link>
        </div>
      } space={
        <div className="home-comparison">
          <h3>직접 운영할 때 <span>창고 임차 비교</span></h3>
          <div className="preview-table-wrap" tabIndex={0} role="region" aria-label="가상 창고 비교 예시">
            <table className="preview-table"><caption className="sr-only">창고 후보별 시설 조건과 확인 사항 · 가상 예시</caption>
              <thead><tr><th scope="col">비교 항목</th><th scope="col">가상 후보 A</th><th scope="col">가상 후보 B</th></tr></thead>
              <tbody>
                <tr><th scope="row">시설 조건</th><td>상온·단층 창고</td><td>냉장·도크 시설</td></tr>
                <tr><th scope="row">비용 확인</th><td>임차료·관리비·이전비</td><td>임차료·전력비·시설비</td></tr>
                <tr><th scope="row">추가 확인</th><td>면적·대형차 진입</td><td>온도대·입주 가능일</td></tr>
              </tbody>
            </table>
          </div>
          <p>필수 시설과 동선을 확인하고 이전에 드는 비용까지 검토합니다.</p>
          <Link className="button button-dark comparison-request" data-funnel-placement="situation" href="/consultation?situation=space">창고 찾기 요청<ArrowRight size={17} /></Link>
        </div>
      } />
      <p className="preview-note">실제 후보의 수용 가능 여부와 견적은 요청 조건 확인 후 검토합니다. 미확인 항목은 ‘확인 필요’로 남깁니다.</p>
      <Link className="text-button preview-detail-link" href="/about#comparison-preview">가상 상황과 판단 근거 자세히 보기<ArrowRight size={15} /></Link>
    </section>
  );
  return (
    <section id="comparison-preview" className="service-preview" aria-labelledby="preview-title">
      <div className="preview-intro">
        <span className="example-label">가상 예시 · 실제 업체·견적 아님</span>
        <h2 id="preview-title">월세가 낮아도, 옮기는 게 유리할까요?</h2>
        <p>재계약을 앞둔 제조사의 창고 비교를 가정한 검토 예시입니다. 아래 조건과 판단은 서비스 설명을 위해 만든 가상 시나리오입니다.</p>
      </div>
      <div className="request-example">
        <strong>설정한 요청 · “지금보다 월세가 낮은 창고를 찾고 싶습니다.”</strong>
        <span>상온 제품 보관 · 대형 화물차 정기 입고 · 기존 납품 동선 유지 필요</span>
      </div>
      <div className="preview-table-wrap" tabIndex={0} role="region" aria-label="가상 후보 비교표, 좌우로 스크롤 가능">
        <table className="preview-table">
          <caption className="sr-only">가정한 창고 조건과 판단 근거 · 실제 거래 사례가 아님</caption>
          <thead><tr><th scope="col">검토 항목</th><th scope="col">가상 후보 A</th><th scope="col">가상 후보 B</th></tr></thead>
          <tbody>
            <tr><th scope="row">월 임차료</th><td>현재보다 낮은 월세</td><td>현재보다 낮은 월세</td></tr>
            <tr><th scope="row">현장·동선 검토</th><td>필요한 대형차 진입 불가</td><td>차량 진입 가능 · 납품 이동 거리 증가</td></tr>
            <tr><th scope="row">비용 검토</th><td>필수조건 미충족으로 비용 비교 중단</td><td>이전비·추가 운송비 반영 시 비용 우위 없음</td></tr>
            <tr><th scope="row">판단 예시</th><td>차량 조건 때문에 후보 제외</td><td>비용 절감 목적의 이전 보류</td></tr>
          </tbody>
        </table>
      </div>
      <div className="preview-decision">
        <strong>이 시나리오의 결론 · 현재 창고 유지 검토</strong>
        <p>현재 조건으로 재계약할 수 있다는 가정에서, 월세만 낮은 후보로 옮기기보다 기존 창고 유지안을 검토합니다.</p>
      </div>
      <p className="preview-note">실제 요청에서는 계약 조건과 견적을 확인한 뒤 판단합니다. 미확인 비용은 ‘확인 필요’로 남깁니다.</p>
      <div className="hero-actions">
        <Link className="button button-dark" href="/consultation?situation=rent-review">내 임차 조건도 비교 요청하기<ArrowRight size={17} /></Link>
      </div>
    </section>
  );
}
