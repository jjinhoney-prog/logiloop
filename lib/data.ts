import type { Article, Hub, Listing, Tier, Visibility } from './types';

export const regions = ['전체 지역', '서울', '인천', '경기', '강원', '대전', '세종', '충북', '충남', '광주', '전북', '전남', '대구', '경북', '부산', '울산', '경남', '제주'];

export const temperatures = ['전체 온도', '상온', '냉장', '냉동'];

export const sizes = ['전체 면적', '1,000㎡ 미만', '1,000㎡ 이상'];

export const tiers: Tier[] = [
  { id: 1, name: '후보 연결', eyebrow: '조건이 정해져 있다면', description: '우리 물량을 맡길 수 있는 물류사와 창고 후보를 찾습니다.', result: '요구조건 요약 · 후보 목록 · 견적 연결', price: '무료', icon: 'Search' },
  { id: 2, name: '조건 비교', eyebrow: '지금보다 나은 조건을 찾는다면', description: '재계약과 업체 변경 전, 같은 조건으로 비용과 서비스를 비교합니다.', result: '동일 조건 비교표 · 추천 / 제외 이유', price: '무료 · 제공 한도 내', icon: 'SlidersHorizontal' },
  { id: 3, name: '운영방식 검토', eyebrow: '빌릴지, 맡길지 고민이라면', description: '직접 임차부터 3PL 위탁, 혼합 운영까지 총비용으로 검토합니다.', result: '총비용 비교 · 전환비 · 다음 확인 사항', price: '범위·비용 사전 협의', icon: 'Workflow' },
];



export const articles: Article[] = [
  { id: 'before-renewal', category: '재계약 체크리스트', title: '창고 재계약 전, 같은 조건으로 비교할 6가지', description: '월 임대료 밖에 있는 비용과 계약 일정을 함께 확인하세요.', read: '3분', sections: [['먼저 현재 조건을 정리하세요', '지역, 면적, 온도, 월평균·피크 물량과 현재 계약의 만료·통지 일정을 정리합니다. 조건이 같아야 비교 결과도 의미가 있습니다.'], ['월 비용과 초기 자금을 나누세요', '임대료뿐 아니라 관리비, 인력, 장비, 운송, 유지비를 함께 봅니다. 반환되는 보증금 원금은 운영비에 합산하지 않고 초기 필요자금으로 구분합니다.'], ['확인되지 않은 비용을 남겨 두세요', '누락된 금액을 0원으로 계산하지 않습니다. 최소 이용료, 할증, 견적 유효기간과 세금 포함 여부를 확인하고 모르는 항목은 확인 대기로 표시합니다.']] },
  { id: 'factory-storage', category: '제조 물류', title: '공장 안 재고, 외부로 옮기기 전에', description: '생산 공간 확보와 추가 운송 부담을 함께 살펴봅니다.', read: '4분', sections: [['보관할 물량부터 나눕니다', '원부자재와 완제품을 구분하고 평균·피크 물량, 회전율, 중량, 필요한 보관 단위를 정리합니다.'], ['공간만 보지 마세요', '차량 접근, 바닥 하중, 층고, 작업 시간은 필수조건이 될 수 있습니다. 필수조건이 맞지 않으면 가격이 낮아도 후보에서 제외합니다.'], ['추가 이동 비용을 확인합니다', '공장과 외부 창고 사이의 운송, 재고 이동, 추가 관리 비용을 포함합니다. 혼합 운영에서는 같은 공간이나 공통 운송비를 두 번 계산하지 않습니다.']] },
  { id: 'lease-or-3pl', category: '운영방식 가이드', title: '직접 임차 vs 3PL, 무엇부터 비교할까요?', description: '운영 인력과 물량 변동에 따라 필요한 대안이 달라집니다.', read: '5분', sections: [['실행 가능한 대안을 먼저 고릅니다', '직접 운영할 인력이 없거나 필수조건을 충족하는 공간이 없다면 직접 임차를 억지로 제시하지 않습니다. 제외 이유를 먼저 정리합니다.'], ['총비용과 전환 부담을 함께 봅니다', '직접 임차는 인건비·장비·전산·유지비를, 3PL은 입출고·보관·포장·반품·최소 이용료·할증을 포함합니다. 혼합 운영에는 거점 간 이동과 관리 비용을 추가합니다.'], ['지금 그대로도 유효한 선택입니다', '평균·비수기·피크 시나리오를 나눠 검토합니다. 확인된 월 순절감액이 0 이하이거나 불확실하면 전환비 회수기간을 산출하지 않습니다. 현재 조건을 유지하는 것도 유효한 결론입니다.']] },
];

// 거리 계산 기준 물류 거점. 좌표는 지도 확인용 대략값(WGS84)이다.
export const hubs: Hub[] = [
  { id: 'busan-newport', name: '부산신항', lat: 35.079, lng: 128.828 },
  { id: 'busan-northport', name: '부산북항', lat: 35.105, lng: 129.048 },
  { id: 'gimhae-airport', name: '김해공항', lat: 35.1795, lng: 128.9382 },
  { id: 'seobusan-ic', name: '서부산IC', lat: 35.159, lng: 128.951 },
  { id: 'donggimhae-ic', name: '동김해IC (남해고속도로)', lat: 35.2332, lng: 128.9051 },
];

// 상담·파트너 신청 폼 선택지. 서버(app/api/inquiry)도 같은 목록으로 입력값을 검증한다.
export const partnerTypes = [
  ['물류사 서비스 소개', '취급 품목·온도·가용 처리량을 함께 정리합니다.'],
  ['창고·물류센터 임대 홍보', '공간·시설·임대 조건을 정리합니다.'],
] as const;
export const regionOptions = ['아직 모름', ...regions.slice(1), '복수 지역 검토'];
export const timingOptions = ['아직 모름', '1개월 이내', '3개월 이내', '6개월 이내', '6개월 이후'];
export const inquiryTemperatureOptions = ['아직 모름', '상온', '냉장', '냉동', '복수 온도대 · 별도 확인'];
export const sourceOptions = ['직접 방문', '블로그', '유튜브', '네이버부동산', '거래처 소개', '기타'];

export function listingHref(item: Pick<Listing, 'id' | 'type'>) {
  return item.type === 'warehouse' ? (`/warehouses/${item.id}` as const) : (`/partners/${item.id}` as const);
}

export const visibilityLabels: Record<Visibility, string> = { hidden: '비공개', published: '공개', archived: '보관' };
export const inquiryStages = ['접수', '연락 중', '검토 중', '종결'] as const;
export const listingTemperatures = ['상온', '냉장', '냉동', '복수 온도대', '확인 필요'];

/** 지음부동산 홈페이지 매물 상세 주소만 출처로 허용한다(supabase/002_source_url.sql과 같은 규칙). */
export const SOURCE_URL_PATTERN = /^https:\/\/ziumrealty\.com\/item\/view\/\d{1,8}$/;

export const isExampleListing = (item: Pick<Listing, 'sourceUrl'>) => !item.sourceUrl;
