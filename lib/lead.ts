/** 리드 우선순위: 현재 월 물류비 구간 × 전환·도입 시기. 담당자 응대 순서 판단용이며 화주에게 노출하지 않는다. */
export const costRanges = ['자가물류·신규 (외부 비용 없음)', '500만원 미만', '500만~1,500만원', '1,500만~3,000만원', '3,000만원 이상', '모름'] as const;
export const switchTimings = ['1개월 이내', '1~3개월', '3~6개월', '6개월 이후', '비교만 원함'] as const;
export const COST_NOTE_LABEL = '현재 월 물류비';

const costScore: Record<string, number> = { '3,000만원 이상': 3, '1,500만~3,000만원': 2, '500만~1,500만원': 1 };
const timingScore: Record<string, number> = { '1개월 이내': 3, '1~3개월': 2, '3개월 이내': 2, '3~6개월': 1, '6개월 이내': 1 };

export type LeadGrade = 'A' | 'B' | 'C' | '미분류';
export function leadGrade(cost = '', timing = ''): LeadGrade {
  const known = (costRanges as readonly string[]).includes(cost) && cost !== '모름' || timing in timingScore || ['6개월 이후', '비교만 원함'].includes(timing);
  if (!known) return '미분류';
  const c = costScore[cost] ?? 0; const t = timingScore[timing] ?? 0;
  if (c >= 2 && t >= 2) return 'A';
  if (c + t >= 3) return 'B';
  return 'C';
}
export const leadOrder: Record<LeadGrade, number> = { A: 0, B: 1, C: 2, '미분류': 3 };

/** 간편 상담은 DB 컬럼 추가 없이 요청사항 첫 줄에 구간을 기록한다. */
export function withCostLine(note: string, cost: string) {
  return (costRanges as readonly string[]).includes(cost) ? `${COST_NOTE_LABEL}: ${cost}${note ? `\n${note}` : ''}` : note;
}
export function costFromNote(note: string) {
  const m = new RegExp(`^${COST_NOTE_LABEL}: (.+)$`, 'm').exec(note);
  return m && (costRanges as readonly string[]).includes(m[1]) ? m[1] : '';
}

export function inquiryLead(r: { kind: string; note: string; timing: string; shipperQuote?: { costRange?: string; switchTiming?: string } }): LeadGrade {
  if (r.kind !== 'consultation') return '미분류';
  return leadGrade(r.shipperQuote?.costRange || costFromNote(r.note), r.shipperQuote?.switchTiming || r.timing);
}
