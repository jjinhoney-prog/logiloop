export const rentReviewTitle = '지금 내는 창고 임차료를 줄이고 싶어요';
export const inquiryNoteLimit = 2000;

export const leaseReviewFields = [
  { key: 'location', label: '현재 창고 소재지', placeholder: '예: 경기 이천시 / 상세 주소는 선택', maxLength: 80 },
  { key: 'area', label: '현재 사용 면적 (㎡ 또는 평)', placeholder: '예: 1,650㎡ 또는 500평', maxLength: 40 },
  { key: 'rent', label: '현재 월 임차료 (만원/월)', placeholder: '예: 1,000 / 모르면 비워두세요', maxLength: 40 },
  { key: 'management', label: '현재 월 관리비 (만원/월)', placeholder: '예: 100 / 없으면 0, 모르면 빈칸', maxLength: 40 },
  { key: 'deposit', label: '현재 보증금 (만원)', placeholder: '예: 10,000 / 월 비용과 별도 비교', maxLength: 40 },
  { key: 'expiry', label: '계약 만료·해지 통지 기한', placeholder: '예: 2027년 6월 만료, 3개월 전 통지', maxLength: 80 },
  { key: 'moveArea', label: '이전 가능한 지역·범위', placeholder: '예: 전국 검토 / 현재 거점 반경 20km', maxLength: 100 },
  { key: 'requirements', label: '유지해야 할 시설·운영 조건', placeholder: '예: 층고 8m, 대형차 진입, 냉장, 도크', maxLength: 160 },
] as const;

export const leaseVatOptions = ['확인 필요', '임차료·관리비 모두 VAT 별도', '임차료·관리비 모두 VAT 포함', '항목별로 다름 · 별도 확인'];
export type LeaseReview = Partial<Record<(typeof leaseReviewFields)[number]['key'] | 'vat', string>>;

/** 동일한 형식을 다운로드·메일·관리자 접수 기록에 사용한다. 금액을 추정하거나 자동 계산하지 않는다. */
export function formatLeaseReview(input: unknown): string {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const rows = leaseReviewFields.map(({ key, label, maxLength }) => {
    const value = typeof raw[key] === 'string' ? raw[key].trim().replace(/[\r\n]+/g, ' ').slice(0, maxLength) : '';
    return `${label}: ${value || '확인 필요'}`;
  });
  const vat = typeof raw.vat === 'string' && leaseVatOptions.includes(raw.vat) ? raw.vat : '확인 필요';
  return ['[현재 임차 조건 · 고객 입력 기준]', ...rows, `VAT 기준: ${vat}`].join('\n');
}

export function leaseNoteRemaining(input: unknown): number {
  return inquiryNoteLimit - formatLeaseReview(input).length - 2;
}

export function leaseReviewNote(input: unknown, note: string): string {
  return [formatLeaseReview(input), note.trim().slice(0, leaseNoteRemaining(input))].filter(Boolean).join('\n\n');
}
