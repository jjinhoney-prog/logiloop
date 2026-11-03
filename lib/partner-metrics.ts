/** 업체가 직접 입력하는 출고 품질·안정성 지표. 공개·리포트에서는 항상 출처(업체 제공/자료 확인)와 기준일을 함께 표시한다. */
export const metricFields = [
  ['sameDayRate', '당일출고율', 'percent', '예: 99.5'],
  ['nextDayRate', '익일배송율', 'percent', '예: 97'],
  ['lossRate', '오출고·파손 등 인정 로스율', 'percent', '예: 0.03'],
  ['returnHandling', '반품·교환 처리 소요', 'choice', ''],
  ['liabilityInsurance', '영업배상보험', 'text', '예: 가입 · 한도 10억 / 미가입'],
  ['fireInsurance', '화재보험', 'text', '예: 건물 가입 · 한도 50억'],
  ['cargoInsurance', '화물·재고(물건)보험', 'text', '예: 화주 별도 가입 필요'],
  ['inventoryAudit', '재고실사 주기', 'text', '예: 분기 1회 · 요청 시 추가'],
  ['videoRecord', '출고 영상 기록', 'text', '예: 전 건 포장 영상 · 30일 보관'],
  ['shipperCount', '현재 운영 화주사 수', 'integer', '예: 25'],
  ['regularStaff', '정규 인원', 'integer', '예: 22'],
  ['contractStaff', '도급·파견 인원', 'integer', '예: 40'],
  ['csStaff', 'CS 전담 인원', 'integer', '예: 3'],
  ['measuredPeriod', '지표 측정 기간·기준', 'text', '예: 2026-07~09, 월 15만 건 기준'],
  ['asOf', '지표 기준일', 'date', ''],
] as const;
export const returnHandlingOptions = ['당일', '익일', '2영업일 이상', '반품 미운영'] as const;
export type MetricKey = typeof metricFields[number][0];
export type PartnerMetrics = Partial<Record<MetricKey, string>>;

const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

export function normalizeMetrics(input: unknown, errors: Record<string, string>, now = Date.now()): PartnerMetrics {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const result: PartnerMetrics = {};
  for (const [key, label, type] of metricFields) {
    const v = raw[key];
    if (v === undefined || v === null || v === '') continue;
    if (typeof v !== 'string') { errors[`metrics.${key}`] = `${label} 형식을 확인하세요.`; continue; }
    const value = v.trim();
    if (!value) continue;
    if (value.length > 200) { errors[`metrics.${key}`] = '200자 이내로 입력하세요.'; continue; }
    if (type === 'percent' && (!/^\d{1,3}(\.\d{1,3})?$/.test(value) || Number(value) > 100)) { errors[`metrics.${key}`] = '0~100 사이 숫자(%)로 입력하세요.'; continue; }
    if (type === 'integer' && !/^\d{1,6}$/.test(value)) { errors[`metrics.${key}`] = '0 이상의 정수로 입력하세요.'; continue; }
    if (type === 'choice' && !(returnHandlingOptions as readonly string[]).includes(value)) { errors[`metrics.${key}`] = '항목을 선택하세요.'; continue; }
    if (type === 'date' && (!validDay(value) || Date.parse(value) > now + 86400000)) { errors[`metrics.${key}`] = '오늘 이전의 유효한 날짜를 선택하세요.'; continue; }
    result[key] = value;
  }
  const filled = Object.keys(result).filter(k => k !== 'asOf');
  if (filled.length && !result.asOf) errors['metrics.asOf'] = '지표를 입력했다면 기준일을 함께 입력하세요.';
  return result;
}

/** 표시용 행. 값이 있는 항목만 반환한다. */
export function metricRows(m: PartnerMetrics | undefined): [string, string][] {
  if (!m) return [];
  return metricFields.filter(([key]) => key !== 'asOf' && m[key]).map(([key, label, type]) => [label, type === 'percent' ? `${m[key]}%` : type === 'integer' ? `${Number(m[key]).toLocaleString('ko-KR')}${key === 'shipperCount' ? '곳' : '명'}` : m[key]!]);
}

/** 지표 출처 라벨. 관리자 자료 검토가 '확인'일 때만 자료 확인으로 표시한다. */
export function metricSource(m: PartnerMetrics | undefined, review?: { documents?: string; checkedAt?: string }) {
  if (!m || !metricRows(m).length) return '';
  const basis = review?.documents === '확인' ? `자료 확인 (${review.checkedAt?.slice(0, 10) ?? '확인일 미상'})` : '업체 제공 · 미확인';
  return `${basis} · 기준일 ${m.asOf || '미입력'}`;
}
