import {contractStandardUrl, shipperContractSections, shipperContractAnnexes} from '@/lib/shipper-contract-guide';
export default function ShipperContractGuide() {
 return <details className="panel" id="shipper-contract-guide">
  <summary>화주–물류사 일반 계약 구성 · 표준양식과 준비 항목</summary>
  <p>국토교통부 물류서비스 표준계약서(17개 조항)를 참고한 검토 목록입니다. 3PL 운영 보완 항목을 함께 표시했습니다. 특정 화주들이 실제 사용한 비율이나 승인된 계약 문안을 뜻하지 않습니다.</p>
  <a href={contractStandardUrl} target="_blank" rel="noopener noreferrer">국토교통부 표준계약서 PDF·HWP 원문 열기</a>
  <dl>{shipperContractSections.map(([title,source,check])=><div key={title}><dt><strong>{title}</strong> <span className="muted small">{source}</span></dt><dd>{check}</dd></div>)}</dl>
  <h3>본문과 함께 준비할 첨부</h3><ul>{shipperContractAnnexes.map(x=><li key={x}>{x}</li>)}</ul>
  <p>화주 요청 → 업체 견적 → 합의한 운영명세·단가표 → 계약 본문·부속서 검토 → 모두싸인 업로드·서명 필드 배치 → 완료본·감사추적 자료 보관 순서로 연결합니다. 모두싸인에는 검토한 본문과 부속서를 함께 올려 확인하세요.</p>
  <p>지급일·배상액·해지 통보기간은 거래별로 합의합니다. 미확정 값은 ‘확인 필요’로 남기고, 기존 가상 테스트 양식은 실제 계약에 사용하지 않습니다. ※ 변호사/세무사 검토 필요.</p>
 </details>;
}
