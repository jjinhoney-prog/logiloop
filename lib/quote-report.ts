import { quoteItems, quoteTotal, type QuoteResponse, type QuoteSpec, type QuoteState } from './quotes';
import { metricRows, metricSource, type PartnerMetrics } from './partner-metrics';

/** 화주가 보는 진행 단계. 셀러나우형 6단계에서 '현장 확인'을 계약 전 필수 단계로 둔다. */
export const reportStages = ['상담 접수', '견적 수집', '리포트 발송', '화주 검토', '현장 확인', '계약 진행', '종결'] as const;
export type ReportStage = typeof reportStages[number];
export const shipperChoices = ['현장 확인 요청', '추가 협의 요청', '보류'] as const;
export type ShipperChoice = typeof shipperChoices[number];
export const REPORT_VALID_DAYS = 30;

export interface ReportSettings { comment: string; recommended: string[]; revealed: string[]; stage: ReportStage }
export interface ShipperReply { choice: ShipperChoice; quoteIds: string[]; message: string; at: string }
export interface ReportQuote { id: string; partnerId: number; partnerName: string; spec: QuoteSpec; state: QuoteState; response: QuoteResponse | null }
export interface ReportPartner { regions: string[]; services: string[]; temperatures: string[]; categories: string[]; metrics?: PartnerMetrics; review?: { documents?: string; checkedAt?: string } }
export interface ReportBaseline { amount: number; vat: '별도' | '포함' }

export interface ReportRow {
  id: string; label: string; revealed: boolean; recommended: boolean; availability: string;
  region: string; center: string; start: string; services: string[]; temperatures: string[]; categories: string[];
  monthly: number | null; firstMonth: number | null; reason: string; vat: string; validUntil: string;
  rates: { item: string; quantity: string; unit: string; rate: string; amount: number | null }[];
  minimum: string; extra: string; setup: string; note: string;
  diffMonthly: number | null; diffAnnual: number | null; diffReason: string;
  metrics: [string, string][]; metricSource: string;
}
export interface ReportView {
  groupId: string; number: string; stage: ReportStage; issuedAt: string; validUntil: string;
  spec: { item: string; region: string; temperature: string; start: string; sku: string; peak: string; quantities: { item: string; quantity: string; unit: string }[] };
  comment: string; rows: ReportRow[]; pending: number; declined: number;
  baseline: ReportBaseline | null; summary: { min: number | null; max: number | null; recommended: string[] };
  replies: ShipperReply[];
}

export const emptySettings = (): ReportSettings => ({ comment: '', recommended: [], revealed: [], stage: '견적 수집' });

export function normalizeSettings(input: unknown, quoteIds: string[]): ReportSettings {
  const v = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  if (typeof v.comment !== 'string' || v.comment.length > 3000) throw new Error('담당자 의견은 3,000자 이내로 입력하세요.');
  const ids = (x: unknown) => { if (!Array.isArray(x) || x.some(id => typeof id !== 'string' || !quoteIds.includes(id))) throw new Error('업체 선택을 확인하세요.'); return [...new Set(x as string[])]; };
  if (!reportStages.includes(v.stage as ReportStage)) throw new Error('진행 단계를 확인하세요.');
  return { comment: v.comment.trim(), recommended: ids(v.recommended), revealed: ids(v.revealed), stage: v.stage as ReportStage };
}

export function normalizeReply(input: unknown, quoteIds: string[], now = new Date()): ShipperReply {
  const v = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  if (!shipperChoices.includes(v.choice as ShipperChoice)) throw new Error('다음 단계를 선택하세요.');
  if (!Array.isArray(v.quoteIds) || v.quoteIds.length > 5 || v.quoteIds.some(id => typeof id !== 'string' || !quoteIds.includes(id))) throw new Error('업체 선택을 확인하세요.');
  if (v.choice === '현장 확인 요청' && !v.quoteIds.length) throw new Error('현장 확인을 원하는 업체를 1곳 이상 선택하세요.');
  if (typeof v.message !== 'string' || v.message.length > 1000) throw new Error('요청 내용은 1,000자 이내로 입력하세요.');
  return { choice: v.choice as ShipperChoice, quoteIds: [...new Set(v.quoteIds as string[])], message: v.message.trim(), at: now.toISOString() };
}

const letter = (i: number) => `${String.fromCharCode(65 + (i % 26))}업체`;

/** 업체 회신과 기존 quoteTotal만으로 화주용 리포트를 만든다. 새로운 금액 추정은 하지 않는다. */
export function buildReport(args: {
  groupId: string; quotes: ReportQuote[]; partners: Record<number, ReportPartner | undefined>; settings: ReportSettings;
  baseline: ReportBaseline | null; replies: ShipperReply[]; issuedAt: string; expiresAt: number | null; now?: number;
}): ReportView {
  const now = args.now ?? Date.now();
  const spec = args.quotes[0]?.spec;
  const replied = args.quotes.filter(q => q.response);
  const offered = replied.filter(q => q.response!.availability !== '불가');
  const declined = replied.length - offered.length;
  const pending = args.quotes.filter(q => !q.response).length;
  const totals = new Map(offered.map(q => [q.id, quoteTotal(q.spec, q.response, now)]));
  const ordered = [...offered].sort((a, b) => {
    const x = totals.get(a.id)!.monthly, y = totals.get(b.id)!.monthly;
    if (x === null && y === null) return a.id.localeCompare(b.id);
    if (x === null) return 1; if (y === null) return -1; return x - y;
  });
  const rows: ReportRow[] = ordered.map((q, i) => {
    const total = totals.get(q.id)!; const r = q.response!; const p = args.partners[q.partnerId];
    const revealed = args.settings.revealed.includes(q.id);
    let diffMonthly: number | null = null; let diffReason = '';
    if (!args.baseline) diffReason = '현재 비용 미입력';
    else if (total.monthly === null) diffReason = '견적 확정 전';
    else if (r.vat !== args.baseline.vat) diffReason = `부가세 기준 상이 (현재 ${args.baseline.vat} / 견적 ${r.vat})`;
    else diffMonthly = Math.round((args.baseline.amount - total.monthly) * 100) / 100;
    return {
      id: q.id, label: revealed ? q.partnerName : letter(i), revealed, recommended: args.settings.recommended.includes(q.id),
      availability: r.availability, region: p?.regions.join(' · ') ?? '', center: revealed ? r.center : (r.center ? '회신 센터 확인됨 · 공개 전' : ''),
      start: r.start, services: p?.services ?? [], temperatures: p?.temperatures ?? [], categories: p?.categories ?? [],
      monthly: total.monthly, firstMonth: total.firstMonth, reason: total.reason, vat: r.vat, validUntil: r.validUntil,
      rates: quoteItems.map((item, k) => ({ item, quantity: q.spec.quantities[k], unit: q.spec.units[k], rate: r.rates[k], amount: q.spec.quantities[k] !== '' && r.rates[k] !== '' ? Math.round(Number(q.spec.quantities[k]) * Number(r.rates[k]) * 100) / 100 : null })),
      minimum: r.minimum, extra: r.extra, setup: r.setup, note: r.note,
      diffMonthly, diffAnnual: diffMonthly === null ? null : Math.round(diffMonthly * 12 * 100) / 100, diffReason,
      metrics: metricRows(p?.metrics), metricSource: metricSource(p?.metrics, p?.review),
    };
  });
  const amounts = rows.map(r => r.monthly).filter((x): x is number => x !== null);
  return {
    groupId: args.groupId, number: args.groupId.slice(0, 8).toUpperCase(), stage: args.settings.stage, issuedAt: args.issuedAt,
    validUntil: args.expiresAt ? new Date(args.expiresAt).toISOString().slice(0, 10) : '',
    spec: { item: spec?.item ?? '', region: spec?.region ?? '', temperature: spec?.temperature ?? '', start: spec?.start ?? '', sku: spec?.sku ?? '', peak: spec?.peak ?? '', quantities: quoteItems.map((item, k) => ({ item, quantity: spec?.quantities[k] ?? '', unit: spec?.units[k] ?? '' })) },
    comment: args.settings.comment, rows, pending, declined, baseline: args.baseline,
    summary: { min: amounts.length ? Math.min(...amounts) : null, max: amounts.length ? Math.max(...amounts) : null, recommended: rows.filter(r => r.recommended).map(r => r.label) },
    replies: args.replies,
  };
}

/** 화주가 직접 입력한 정확액만 기준으로 쓴다. 구간값으로 차액을 계산하지 않는다. */
export function baselineFrom(q: { currentCost?: string; currentCostVat?: string } | undefined): ReportBaseline | null {
  if (!q?.currentCost || !/^\d{1,12}$/.test(q.currentCost) || !['별도', '포함'].includes(q.currentCostVat ?? '')) return null;
  return { amount: Number(q.currentCost), vat: q.currentCostVat as '별도' | '포함' };
}
