import type { TierId } from './types';
import { rentReviewTitle } from './lease-review';

export const requestSituations: { id: string; title: string; description: string; tier: TierId }[] = [
  { id: 'change', title: '물류사를 변경하고 싶어요', description: '재계약 전에 비용과 서비스 조건을 비교합니다.', tier: 2 },
  { id: 'outsource', title: '물류를 처음 맡기려고 해요', description: '보관·입출고를 맡길 3PL 후보를 찾습니다.', tier: 1 },
  { id: 'space', title: '창고 공간이 필요해요', description: '지역·면적·시설 조건에 맞는 공간을 찾습니다.', tier: 1 },
  { id: 'rent-review', title: rentReviewTitle, description: '현재 임차 조건과 비교해 비용을 낮출 수 있는 후보를 검토합니다.', tier: 2 },
  { id: 'cold', title: '냉장·냉동 운영이 필요해요', description: '품목과 온도대에 맞는 공간·운영사를 검토합니다.', tier: 1 },
  { id: 'unsure', title: '어떤 방식이 맞을지 모르겠어요', description: '창고 임차와 물류 위탁부터 함께 검토합니다.', tier: 3 },
];

export const unsureSituation = requestSituations.find((situation) => situation.id === 'unsure')!;

export const serviceSteps = [
  { title: '조건을 정리합니다', description: '품목·물량·지역·일정을 확인합니다. 미정인 조건은 함께 정리합니다.', result: '요구조건 요약' },
  { title: '후보를 검토합니다', description: '공간·서비스 조건과 해당 물량의 수용 가능 여부를 확인합니다.', result: '후보 목록 · 확인 상태' },
  { title: '비교하고 다음 단계를 정합니다', description: '업무 범위에 맞춰 비용·서비스·전환 부담을 비교합니다.', result: '비교표 · 다음 확인 사항' },
];

export const costNotice = '비용은 업무 범위 확인 후 안내합니다.';
export const responseNotice = '담당자가 접수 내용을 확인한 뒤 남겨주신 연락처로 연락드립니다. 후보 안내 일정은 조건 확인 후 협의합니다.';
export const disclosureOptions = ['담당자와 협의 후 결정', '시설·서비스 정보 공개 검토', '개별 화주 요청에 한해 정보 제공 검토'];
