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
  /** 업체가 링크로 직접 회신했는지, 담당자가 업체 자체 견적서를 표준 양식으로 옮겼는지. 없으면 업체 회신. */
  source?: QuoteSource; original?: string; enteredAt?: string;
}
export const quoteSources = ['업체 회신', '담당자 정리'] as const;
export type QuoteSource = typeof quoteSources[number];
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
/** 회신기한이 지나도 업체가 표준 양식으로 직접 회신할 수 있는 기간(일). 늦은 회신은 '기한 후 회신'으로 표시한다. */
export const LATE_REPLY_DAYS = 7;
export const deadlineEnd = (date: string) => Date.parse(`${date}T23:59:59.999+09:00`);
export const replyWindowEnd = (date: string) => deadlineEnd(date) + LATE_REPLY_DAYS * 86400000;
export const replyWindowClosed = (date: string, now = Date.now()) => !validDate(date) || now >= replyWindowEnd(date);
export const replyWindowLastDay = (date: string) => validDate(date) ? new Date(replyWindowEnd(date) + 9 * 3600000).toISOString().slice(0, 10) : '';
export const repliedLate = (deadline: string, repliedAt?: string | null) => !!repliedAt && validDate(deadline) && Date.parse(repliedAt) > deadlineEnd(deadline);
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
  return { ...result, source: '업체 회신' };
}
/** 업체가 링크로 직접 회신할 때는 비교에 꼭 필요한 값을 비워둘 수 없다. */
export function normalizeSupplierResponse(input: unknown, spec: QuoteSpec): QuoteResponse {
  const result = normalizeQuoteResponse(input);
  if (result.availability === '불가') return result;
  if (result.vat === '확인 필요') throw new Error('부가세 별도·포함 중 하나를 선택하세요.');
  if (result.minimum === '' || result.extra === '') throw new Error('월 최소요금과 월 별도 비용을 입력하세요. 없으면 0을 입력합니다.');
  const missing = quoteItems.filter((_, i) => spec.quantities[i] !== '' && Number(spec.quantities[i]) > 0 && result.rates[i] === '');
  if (missing.length) throw new Error(`물량이 있는 항목의 단가를 입력하세요: ${missing.join('·')}. 제공하지 않는 항목은 '조건부'로 바꾸고 수용 조건에 적어 주세요.`);
  return result;
}
/** 업체가 자체 양식(엑셀·PDF·카톡)으로 보낸 견적을 담당자가 표준 양식으로 옮긴다. 원문은 대조용으로 보관한다. */
export function normalizeProxyResponse(input: unknown, now = new Date()): QuoteResponse {
  const v = object(input);
  const original = text(v.original, 8000);
  if (!original) throw new Error('업체가 보낸 견적 원문(또는 파일명·주요 수치)을 붙여넣으세요.');
  return { ...normalizeQuoteResponse(input), source: '담당자 정리', original, enteredAt: now.toISOString() };
}
/** 회신기한까지 남은 일수(한국시간). 음수면 지남. */
export function daysUntilDeadline(deadline: string, now = Date.now()) {
  if (!validDate(deadline)) return null;
  const today = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);
}
export function quoteReminderText(id: string, partnerName: string, spec: QuoteSpec, now = Date.now()) {
  const d = daysUntilDeadline(spec.deadline, now);
  const due = d === null ? '회신기한 확인 필요' : d > 0 ? `회신기한 ${spec.deadline} (D-${d})` : d === 0 ? `회신기한 오늘(${spec.deadline})` : `회신기한 ${spec.deadline} 경과 · 받은 링크로 ${replyWindowLastDay(spec.deadline)}까지 회신 가능`;
  return [`[로지루프] ${partnerName} 견적 회신 요청 · ${id.slice(0, 8).toUpperCase()}`, `${spec.region} · ${spec.temperature} · ${spec.item} 건입니다.`, due, '', '화주가 비교 검토를 기다리고 있습니다.', '보내드린 링크 입력이 어려우시면 귀사 견적서(엑셀·PDF·사진) 그대로 회신해 주셔도 됩니다.', '로지루프가 표준 비교표로 정리해 화주에게 전달합니다.', '', '꼭 필요한 항목: 보관·입고·출고·포장·택배·반품 단가 / 월 최소요금 / 초기비용 / 부가세 포함 여부 / 견적 유효기간'].join('\n');
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
