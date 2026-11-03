export const quoteItems = ['보관', '입고', '출고', '포장', '택배', '반품'] as const;
export const quoteStates = ['초안', '전달 준비', '전달 완료', '회신 완료', '종결'] as const;
export type QuoteState = typeof quoteStates[number];
export interface QuoteSpec {
  item: string; region: string; temperature: string; start: string; sku: string; peak: string; operations: string; deadline: string;
  quantities: string[]; units: string[];
}
export interface QuoteResponse {
  availability: string; center: string; start: string; rates: string[];
  minimum: string; extra: string; setup: string; vat: string; validUntil: string; note: string;
}
export interface QuoteView {
  id: string; groupId: string; inquiryId: number; partnerId: number; partnerName: string;
  spec: QuoteSpec; state: QuoteState; response: QuoteResponse | null; revision: string;
  createdAt: string; sentAt?: string; repliedAt?: string; deliveryNote: string;
}
export const emptyQuoteSpec = (): QuoteSpec => ({ item:'',region:'',temperature:'',start:'',sku:'',peak:'',operations:'',deadline:'',quantities:Array(6).fill(''),units:['팔레트·월','팔레트','주문건','건','건','건'] });
export const emptyQuoteResponse = (): QuoteResponse => ({ availability:'가능',center:'',start:'',rates:Array(6).fill(''),minimum:'',extra:'',setup:'',vat:'확인 필요',validUntil:'',note:'' });
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown, max: number) => { if (typeof v !== 'string' || v.length > max) throw new Error('입력 길이와 형식을 확인해 주세요.'); return v.trim(); };
const number = (v: unknown) => { const s = text(v, 15); if (s && (!/^\d{1,9}(\.\d{1,2})?$/.test(s) || !Number.isFinite(Number(s)))) throw new Error('수량·금액은 0 이상의 숫자로 입력하세요.'); return s; };
export function validDate(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export const deadlinePassed = (date: string, now = Date.now()) => !validDate(date) || now >= Date.parse(`${date}T23:59:59.999+09:00`);
export function normalizeQuoteSpec(input: unknown): QuoteSpec {
  const v = object(input); const base = emptyQuoteSpec();
  for (const key of ['item','region','temperature','start','sku','peak','operations','deadline'] as const) base[key] = text(v[key], key === 'operations' ? 8000 : 200);
  if (!base.item || !base.region || !base.temperature || !base.start || !validDate(base.deadline)) throw new Error('품목·지역·온도·시작일·회신기한을 확인하세요.');
  if (!Array.isArray(v.quantities) || v.quantities.length !== 6 || !Array.isArray(v.units) || v.units.length !== 6) throw new Error('6개 비용 항목의 수량·단위를 확인하세요.');
  base.quantities = v.quantities.map(number); base.units = v.units.map(x => text(x, 30));
  if (base.units.some(x => !x)) throw new Error('과금 단위를 입력하세요.');
  return base;
}
export function normalizeQuoteResponse(input: unknown): QuoteResponse {
  const v = object(input); const result = emptyQuoteResponse();
  for (const key of ['availability','center','start','vat','validUntil','note'] as const) result[key] = text(v[key], key === 'note' ? 2000 : 200);
  if (!['가능','조건부','불가'].includes(result.availability) || !['별도','포함','확인 필요'].includes(result.vat)) throw new Error('수용 여부와 부가세 기준을 확인하세요.');
  if (result.availability !== '불가' && (!result.center || !result.start || !validDate(result.validUntil))) throw new Error('가능 센터·시작일·견적 유효기간을 입력하세요.');
  if (!Array.isArray(v.rates) || v.rates.length !== 6) throw new Error('견적 항목을 확인하세요.');
  result.rates = v.rates.map(number);
  for (const key of ['minimum','extra','setup'] as const) result[key] = number(v[key]);
  return result;
}
/** Six item subtotal is subject to a monthly minimum; additional recurring charges are added after it. */
export function quoteTotal(spec: QuoteSpec, reply: QuoteResponse | null, now = Date.now()): { monthly: number | null; firstMonth: number | null; reason: string } {
  const unknown = (reason: string) => ({ monthly: null, firstMonth: null, reason });
  if (!reply) return unknown('미회신');
  if (reply.availability === '불가') return unknown('수용 불가');
  if (deadlinePassed(reply.validUntil, now)) return unknown('유효기간 만료 또는 미입력');
  if (reply.vat === '확인 필요') return unknown('부가세 기준 확인 필요');
  if (spec.quantities.some(q => q === '') || spec.quantities.some((q,i) => Number(q) > 0 && reply.rates[i] === '') || reply.minimum === '' || reply.extra === '') return unknown('수량·견적 보완 필요');
  const subtotal = spec.quantities.reduce((sum,q,i) => sum + Number(q) * Number(reply.rates[i] || 0), 0);
  const monthly = Math.round((Math.max(subtotal, Number(reply.minimum)) + Number(reply.extra)) * 100) / 100;
  if (!Number.isFinite(monthly) || monthly > Number.MAX_SAFE_INTEGER) return unknown('계산 범위 초과');
  return { monthly, firstMonth: reply.setup === '' ? null : Math.round((monthly + Number(reply.setup)) * 100) / 100, reason: reply.availability === '조건부' ? '조건부 · 수용 조건 확인' : '업체 회신 기준' };
}
export function quoteRequestText(id: string, partnerName: string, spec: QuoteSpec) {
  return [`로지루프 견적 요청 ${id}`, `수신 업체: ${partnerName}`, `품목: ${spec.item}`, `지역: ${spec.region}`, `온도: ${spec.temperature}`, `시작: ${spec.start}`, `SKU: ${spec.sku || '확인 필요'}`, `피크: ${spec.peak || '확인 필요'}`, ...quoteItems.map((name,i) => `${name}: ${spec.quantities[i] || '확인 필요'} ${spec.units[i]}`), `작업 조건: ${spec.operations || '확인 필요'}`, `회신기한: ${spec.deadline} (한국시간)`, '통화: 원화. 아래 전용 링크로 수용 여부와 견적을 회신해 주세요.'].join('\n');
}
