import { isExampleListing } from './data';
import type { Listing } from './types';

export const warehouseRegions = [
  {
    slug: 'busan-gangseo', name: '부산 강서구', requestRegion: '부산', requestDetail: '강서구',
    title: '부산 강서구 창고 임대',
    description: '부산 강서구의 창고·물류센터 등록 매물을 비교하세요. 면적, 임대 조건, 차량 진입과 시설 정보를 살펴보고 필요한 조건으로 상담을 요청할 수 있습니다.',
    focus: '같은 강서구라도 실제 운송 출발지와 납품처에 따라 필요한 입지가 달라집니다. 사용할 차량과 하루 운행 경로를 먼저 정리한 뒤 후보를 비교하세요.',
    questions: [
      ['운송 경로', '상세 페이지의 위치는 권역 대표 위치입니다. 실제 매물 주소를 확인한 뒤 항만·거래처까지의 운행 경로와 시간대별 이동 시간을 비교하세요.'],
      ['차량과 작업 공간', '대형차 진입 표기만으로 회차·대기·상하차 공간이 확보되는 것은 아닙니다. 사용하는 차량의 길이와 동시 입차 대수를 기준으로 확인하세요.'],
      ['보관과 작업의 구분', '보관 외에 포장·조립 등 작업이 필요하면 사용 가능한 용도, 전력과 작업 시간을 담당자에게 함께 전달하세요.'],
    ],
    guideId: 'factory-storage', guideLabel: '공장 밖 보관 공간 검토 가이드',
  },
  {
    slug: 'gimhae', name: '김해', requestRegion: '경남', requestDetail: '김해',
    title: '김해 창고 임대·물류센터',
    description: '김해의 창고·물류센터 등록 매물을 면적과 임대 조건으로 비교하세요. 진입로, 보관 규모, 필요한 설비를 확인하고 화주 조건에 맞는 후보를 요청하세요.',
    focus: '현재 공장이나 납품처와의 왕복 운행을 기준으로 후보를 비교하세요. 보관 면적뿐 아니라 입출고 빈도와 재고 이동에 필요한 작업 공간을 함께 계산해야 합니다.',
    questions: [
      ['진입로와 회차', '희망 읍·면과 실제 출발지를 정하고, 후보별 진입로 폭·회차 공간을 사용하는 차량 규격으로 확인하세요.'],
      ['공장 외부 보관', '원자재·완제품 보관량, 공장과 창고 사이의 하루 이동 횟수, 우천 시 하역 방법을 정리하면 필요한 공간을 좁힐 수 있습니다.'],
      ['랙과 설비', '등록 면적에 사무실·공용 공간이 포함되는지 확인하세요. 랙 배치에는 유효 높이와 바닥 하중, 지게차 통로가 함께 필요합니다.'],
    ],
    guideId: 'factory-storage', guideLabel: '원자재·완제품 외부 보관 가이드',
  },
  {
    slug: 'yangsan', name: '양산', requestRegion: '경남', requestDetail: '양산',
    title: '양산 창고 임대·물류센터',
    description: '양산의 창고·물류센터 등록 매물을 비교하세요. 상하차 동선, 도크, 온도 조건과 임대 면적을 살펴보고 직접 임차 또는 물류 위탁을 검토할 수 있습니다.',
    focus: '보관만 필요한지, 입출고 운영까지 필요한지 먼저 구분하세요. 직접 임차 후보의 임대 조건과 함께 인력·장비·차량 운영에 필요한 조건도 정리해야 합니다.',
    questions: [
      ['상하차 동선', '입고와 출고가 겹치는 시간대를 기준으로 차량 대기 공간과 작업 동선을 확인하세요. 도크가 등록된 후보는 높이와 동시 접안 대수를 확인하세요.'],
      ['냉장·냉동 운영', '냉장·냉동 표기와 실제 수용 온도를 구분하세요. 목표 온도, 설비 가동 상태, 전기요금과 유지보수 부담 주체는 별도 확인이 필요합니다.'],
      ['직접 임차와 위탁', '월 임대료 외에 인력·장비·관리 비용을 정리하고, 물류 위탁 견적은 동일한 보관량과 출고량으로 비교하세요.'],
    ],
    guideId: 'lease-or-3pl', guideLabel: '직접 임차와 3PL 비교 가이드',
  },
] as const;

export type WarehouseRegion = (typeof warehouseRegions)[number];

export function findWarehouseRegion(slug: string) {
  return warehouseRegions.find((region) => region.slug === slug);
}

export function matchesWarehouseRegion(item: Listing, region: WarehouseRegion): boolean {
  if (item.type !== 'warehouse' || isExampleListing(item)) return false;
  if (region.slug === 'busan-gangseo') return item.region === '부산' && item.district.includes('강서구');
  return item.region === region.name;
}

export const warehouseRegionHref = (slug: WarehouseRegion['slug']) => `/warehouses/regions/${slug}` as const;

/** 셀러나우형 센터 리뷰를 부울경 실매물 기준으로: 점수 없이 현장 확인 항목만 제시한다. */
export const operationChecks = [
  ['접안·도크', '도크 수와 높이, 동시 접안 가능 대수. 윙바디·컨테이너 동시 작업 여부'],
  ['유효 층고', '보·스프링클러 아래 실제 적재 높이. 랙 단수와 팔레트 적재 높이 계산 기준'],
  ['바닥 하중', '㎡당 허용 하중과 층별 차이. 중량물·고단 랙 설치 가능 여부'],
  ['회차·대기 공간', '사용 차량 길이 기준 회차 반경, 입차 대기 공간, 램프 폭'],
  ['전력·설비', '수전 용량, 냉장·냉동 설비 상태, 소방 설비와 위험물 취급 제한'],
  ['인력·출퇴근', '야간·주말 작업 인력 수급, 대중교통·통근 버스 접근성'],
  ['용도·인허가', '건축물 용도(창고시설·공장), 보관·포장·가공 작업 허용 범위'],
] as const;

/** 공개 매물에 실제로 기록된 시설 항목 수. 없는 값을 추정하지 않는다. */
export function operationCoverage(items: Pick<Listing, 'height' | 'power' | 'area'>[]) {
  return { total: items.length, height: items.filter(i => i.height).length, power: items.filter(i => i.power).length, area: items.filter(i => i.area).length };
}
