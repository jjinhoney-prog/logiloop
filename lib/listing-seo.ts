import type { Metadata } from 'next';
import { isExampleListing } from './data';
import type { Listing } from './types';

/** 등록된 값만 사용한다. DB 수정 시 설명에도 같은 변경이 반영된다. */
export function listingMetadata(item: Listing): Metadata {
  const example = isExampleListing(item);
  const path = `/${item.type === 'warehouse' ? 'warehouses' : 'partners'}/${encodeURIComponent(item.id)}`;
  const conditions = [
    item.area ? `${item.area.toLocaleString('ko-KR')}㎡` : item.capacity,
    item.price,
    item.height ? `층고 ${item.height}` : '',
    item.power ? `전력 ${item.power}` : '',
  ].filter(Boolean).join(' · ');
  const description = example
    ? `${item.name}. 서비스 이용을 설명하기 위한 가상 예시입니다. 실제 공급 정보가 아닙니다.`
    : `${item.region} ${item.district}의 ${item.service}. ${conditions}. 입주 일정과 실제 수용 조건은 상담 시 확인합니다.`;

  return {
    title: example ? `${item.name} (가상 예시)` : item.name,
    description,
    alternates: { canonical: path },
    robots: { index: !example, follow: true },
    openGraph: { title: item.name, description, url: path, type: 'website' },
  };
}

/** 설비 보유를 추가로 단정하지 않고, 등록 조건에 맞는 상담 질문을 안내한다. */
export function warehouseReviewQuestions(item: Listing): string[] {
  const questions = ['보관 품목과 적재 중량에 맞는 바닥 하중·소방 조건을 확인하세요.'];
  if (item.height) questions.push('등록 층고와 보·배관 아래 실제 유효 높이를 구분해 랙 설치 가능 높이를 확인하세요.');
  if (item.power) questions.push('등록 전력과 실제 사용 가능한 전력을 확인하고, 사용할 장비의 필요 전력과 비교하세요.');
  if (item.tags.includes('도크')) questions.push('사용 차량의 적재함 높이와 도크 높이, 동시 접안 가능 대수를 확인하세요.');
  if (item.tags.includes('대형차 진입')) questions.push('사용 차량의 길이·회전 반경을 기준으로 진입로와 회차 공간을 확인하세요.');
  if (item.tags.some((tag) => tag === '냉장' || tag === '냉동')) questions.push('필요 온도 범위, 냉동·냉장 설비의 가동 상태와 전기요금 부담 주체를 확인하세요.');
  return questions;
}
