/** 위탁·임차 비용 비교. 화주가 넣은 값만 계산하며 시세·단가를 채우지 않는다. 단위는 만원. */
/** timing은 한 번 드는 비용이 계약 시작(start)과 종료(end) 중 언제 드는지 구분한다. */
export type CostField = { key: string; label: string; hint: string; timing?: 'start' | 'end' };

export const outsourceMonthlyFields: CostField[] = [
  { key: 'storage', label: '월 보관비', hint: '팔레트·면적 기준 보관료' },
  { key: 'handling', label: '월 입출고·작업비', hint: '입고·피킹·포장·출고' },
  { key: 'outsourceExtra', label: '월 기타 비용', hint: '시스템·최소요금·별도 과금' },
];
export const outsourceOnceFields: CostField[] = [
  { key: 'onboarding', label: '초기 이관비', hint: '재고 이동·설정비', timing: 'start' },
];
export const leaseMonthlyFields: CostField[] = [
  { key: 'rent', label: '월 임차료', hint: '보증금 제외' },
  { key: 'maintenance', label: '월 관리비', hint: '관리비·공과금' },
  { key: 'labor', label: '월 인건비', hint: '창고 운영 인력' },
  { key: 'equipment', label: '월 장비·시스템비', hint: '지게차·랙·WMS 등' },
];
export const leaseOnceFields: CostField[] = [
  { key: 'moveIn', label: '초기 입주·설비비', hint: '이전비·랙·시설 공사', timing: 'start' },
  { key: 'restore', label: '종료 시 원상복구비', hint: '계약 종료 때 드는 비용', timing: 'end' },
];

export const periodOptions = [12, 24, 36, 60];
export const defaultPeriod = 24;

export type CostInputs = Record<string, number | null | undefined>;
/** once = start + end. start는 계약 시작 때, end는 계약 종료 때 드는 비용. */
type Side = { monthly: number; once: number; start: number; end: number; total: number; missing: string[] };
export type CostComparison = {
  outsource: Side;
  lease: Side;
  /** 양쪽 모두 월 비용이 하나 이상 입력되어 합계를 보여줄 수 있다. */
  ready: boolean;
  /** 모든 칸이 입력되어(0 포함) 판단을 표시할 수 있다. */
  complete: boolean;
  lower: 'outsource' | 'lease' | 'same' | null;
  gap: number | null;
  /** 일회성 비용이 큰 쪽이 처음으로 합계가 낮아지는 개월 수. */
  breakEvenMonths: number | null;
  /** 두 합계가 정확히 같아지는 개월 수. 나누어떨어질 때만 있다. */
  evenMonths: number | null;
};

/** 소수점 아래는 한 자리(천원 단위)까지 받는다. */
const DECIMALS = 1;
const round = (value: number) => Math.round(value * 10 ** DECIMALS) / 10 ** DECIMALS;

/** 입력창 표시용 정리. 숫자·소수점 하나만 남기고 정수부에 쉼표를 넣는다. 입력 중인 "12."도 유지한다. */
export function cleanCostInput(value: string): string {
  const kept = value.replace(/[^\d.]/g, '');
  const dot = kept.indexOf('.');
  const intPart = (dot === -1 ? kept : kept.slice(0, dot)).slice(0, 9);
  const grouped = intPart === '' ? '' : Number(intPart).toLocaleString('ko-KR');
  if (dot === -1) return grouped;
  const fraction = kept.slice(dot + 1).replace(/\./g, '').slice(0, DECIMALS);
  return `${grouped || '0'}.${fraction}`;
}

/** 빈칸은 null, 0은 0으로 구분한다. 12.5는 12.5만원으로 읽고 소수점을 버리지 않는다. */
export function parseCostInput(value: string): number | null {
  const cleaned = cleanCostInput(value).replace(/,/g, '');
  return cleaned === '' ? null : round(Number(cleaned));
}

function sumSide(inputs: CostInputs, monthlyFields: CostField[], onceFields: CostField[], months: number): Side {
  const sum = (fields: CostField[]) => round(fields.reduce((total, field) => total + (inputs[field.key] ?? 0), 0));
  const monthly = sum(monthlyFields);
  const start = sum(onceFields.filter((field) => field.timing !== 'end'));
  const end = sum(onceFields.filter((field) => field.timing === 'end'));
  const once = round(start + end);
  const missing = [...monthlyFields, ...onceFields].filter((field) => inputs[field.key] == null).map((field) => field.label);
  return { monthly, once, start, end, total: round(monthly * months + once), missing };
}

function hasMonthly(inputs: CostInputs, fields: CostField[]) {
  return fields.some((field) => inputs[field.key] != null);
}

export function compareCosts(inputs: CostInputs, months: number): CostComparison {
  const outsource = sumSide(inputs, outsourceMonthlyFields, outsourceOnceFields, months);
  const lease = sumSide(inputs, leaseMonthlyFields, leaseOnceFields, months);
  const ready = hasMonthly(inputs, outsourceMonthlyFields) && hasMonthly(inputs, leaseMonthlyFields);
  const complete = ready && outsource.missing.length === 0 && lease.missing.length === 0;
  if (!complete) return { outsource, lease, ready, complete, lower: null, gap: null, breakEvenMonths: null, evenMonths: null };

  const gap = round(Math.abs(outsource.total - lease.total));
  const lower = outsource.total === lease.total ? 'same' : outsource.total < lease.total ? 'outsource' : 'lease';
  // 0.1만원 단위 정수로 바꿔 나눗셈 경계(동률)를 정확히 판단한다.
  const unit = 10 ** DECIMALS;
  const monthlyGap = Math.round((outsource.monthly - lease.monthly) * unit);
  const onceGap = Math.round((lease.once - outsource.once) * unit);
  // 한쪽이 일회성 비용은 크고 월 비용은 작을 때만 역전 시점이 있다.
  if (monthlyGap === 0 || onceGap === 0 || Math.sign(monthlyGap) !== Math.sign(onceGap)) return { outsource, lease, ready, complete, lower, gap, breakEvenMonths: null, evenMonths: null };
  const ratio = onceGap / monthlyGap;
  const even = onceGap % monthlyGap === 0;
  // ratio개월에 같아지면 다음 달부터 낮아진다. 나누어떨어지지 않으면 올림한 달부터 낮아진다.
  return { outsource, lease, ready, complete, lower, gap, breakEvenMonths: even ? ratio + 1 : Math.ceil(ratio), evenMonths: even ? ratio : null };
}

export function formatManwon(value: number) {
  return `${value.toLocaleString('ko-KR')}만원`;
}
