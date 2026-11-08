/** 계약 갱신 점검표. 법적 판단이 아닌 확인 항목만 담는다. */
export const renewalChecklist: { id: string; title: string; items: { id: string; label: string }[] }[] = [
  { id: 'contract', title: '계약 조건', items: [
    { id: 'expiry', label: '계약 만료일과 갱신·해지 통지 기한을 확인했습니다.' },
    { id: 'auto', label: '자동 갱신 조항과 단가 조정 조건을 확인했습니다.' },
    { id: 'exit', label: '원상복구·재고 이관 등 종료 시 의무를 확인했습니다.' },
  ] },
  { id: 'cost', title: '비용', items: [
    { id: 'billing', label: '최근 12개월 실제 청구액을 항목별로 정리했습니다.' },
    { id: 'extra', label: '최소요금·피크 할증·별도 과금 항목을 구분했습니다.' },
    { id: 'vat', label: '비교할 금액의 부가세 포함 여부를 맞췄습니다.' },
  ] },
  { id: 'operation', title: '운영', items: [
    { id: 'volume', label: '2027년 보관량과 출고량 변화를 예상했습니다.' },
    { id: 'quality', label: '출고 마감·오출고·재고 차이 이슈를 정리했습니다.' },
    { id: 'site', label: '면적 여유·차량 진입·납품 동선을 점검했습니다.' },
  ] },
  { id: 'option', title: '대안', items: [
    { id: 'quote', label: '같은 조건으로 다른 후보의 견적을 받아봤습니다.' },
    { id: 'model', label: '위탁과 임차 중 어떤 방식이 맞는지 비교했습니다.' },
    { id: 'schedule', label: '이전이 필요할 경우의 일정과 운영 공백을 계산했습니다.' },
  ] },
];

export const renewalChecklistCount = renewalChecklist.reduce((total, group) => total + group.items.length, 0);

/** 요청서 담당자에게 유입 맥락을 전달한다. 연락처·금액은 URL에 넣지 않는다. */
export const renewalServiceParam = encodeURIComponent('2027 계약 갱신 점검 페이지에서 요청');
