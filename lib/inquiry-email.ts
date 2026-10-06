import { inquiryTemperatureOptions, partnerTypes, regionOptions, sourceOptions, tiers, timingOptions } from './data';
import { COMPARE_LIMIT, validateInquiry } from './logic';
import type { InquiryData, InquiryErrors, Listing, TierId } from './types';

/** 폼의 maxLength와 같은 값. 서버에서 다시 자른다. */
export const FIELD_LIMITS = { company: 100, name: 100, phone: 20, item: 100, volume: 100, regionDetail: 150, note: 2000 } as const;

export interface InquiryPayload extends InquiryData {
  partnership: boolean;
  targets: string[];
  /** 허니팟. 사람에게는 보이지 않는 필드라 값이 있으면 자동 입력으로 본다. */
  website?: string;
}

export interface NormalizedInquiry {
  data: InquiryData;
  partnership: boolean;
  /** 공개 매물 중 실제로 존재하는 후보만 남긴 ID (최대 3개) */
  targetIds: string[];
  targetNames: string[];
}

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const pick = (value: unknown, allowed: readonly string[], fallback: string) => (typeof value === 'string' && allowed.includes(value) ? value : fallback);

/** 신뢰할 수 없는 요청 본문을 폼과 같은 규칙으로 정리하고 검증한다. catalog는 공개 매물 목록이다. */
export function normalizeInquiry(body: unknown, catalog: Pick<Listing, 'id' | 'name'>[]): { value: NormalizedInquiry; errors: InquiryErrors } {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const partnership = raw.partnership === true;
  const tier = ([1, 2, 3] as const).find((t) => t === raw.tier) ?? (1 as TierId);
  const data: InquiryData = {
    tier,
    help: partnership ? pick(raw.help, partnerTypes.map(([t]) => t), partnerTypes[0][0]) : '',
    company: str(raw.company, FIELD_LIMITS.company),
    name: str(raw.name, FIELD_LIMITS.name),
    phone: str(raw.phone, FIELD_LIMITS.phone),
    item: str(raw.item, FIELD_LIMITS.item),
    volume: str(raw.volume, FIELD_LIMITS.volume) || '아직 모름',
    region: pick(raw.region, regionOptions, '아직 모름'),
    regionDetail: str(raw.regionDetail, FIELD_LIMITS.regionDetail),
    timing: pick(raw.timing, timingOptions, '아직 모름'),
    temperature: pick(raw.temperature, inquiryTemperatureOptions, '아직 모름'),
    note: str(raw.note, FIELD_LIMITS.note),
    consent: raw.consent === true,
    source: pick(raw.source, sourceOptions, '기타'),
  };
  const targets = Array.isArray(raw.targets) ? raw.targets.filter((id): id is string => typeof id === 'string') : [];
  const matched = [...new Set(targets)]
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item): item is Pick<Listing, 'id' | 'name'> => Boolean(item))
    .slice(0, COMPARE_LIMIT);
  return {
    value: { data, partnership, targetIds: matched.map((item) => item.id), targetNames: matched.map((item) => item.name) },
    errors: validateInquiry(data, partnership),
  };
}

export function isHoneypotFilled(body: unknown) {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>).website : undefined;
  return typeof value === 'string' && value.trim() !== '';
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 메일 제목 헤더에 줄바꿈이 섞이지 않게 한 줄로 만든다. */
const oneLine = (value: string, max = 60) => value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);

const regionLabel = (data: InquiryData) => (data.regionDetail ? `${data.region} · ${data.regionDetail}` : data.region);

export function formatKst(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date) + ' (KST)';
}

export function buildSubject({ data, partnership }: NormalizedInquiry) {
  if (partnership) return oneLine(`[로지루프 파트너] ${data.help} · ${data.region} · ${oneLine(data.company, 40)}`, 120);
  const tier = tiers.find((t) => t.id === data.tier)!;
  return oneLine(`[로지루프 상담] ${tier.id}등급 ${tier.name} · ${data.region} · ${oneLine(data.item, 40)}`, 120);
}

/** 메일 본문 표의 행. 지시서의 순서(회사명 → 접수 시각)를 따른다. */
export function emailRows({ data, targetNames }: NormalizedInquiry, receivedAt: Date): [string, string][] {
  return [
    ['회사명', data.company],
    ['담당자', data.name],
    ['연락처', data.phone],
    ['품목', data.item || '미입력'],
    ['물량', data.volume],
    ['지역', regionLabel(data)],
    ['시점', data.timing],
    ['온도', data.temperature],
    ['요청사항', data.note || '없음'],
    ['유입경로', data.source],
    ['비교 후보', targetNames.join(', ') || '미정'],
    ['접수 시각', formatKst(receivedAt)],
  ];
}

/** inquiryId가 있으면 DB 접수번호를, 없으면 메일 전용 접수임을 메일 하단에 적는다. */
export function storageNote(inquiryId?: number) {
  return inquiryId ? `DB 접수번호 #${inquiryId} · 운영 워크스페이스(/admin)에서 진행 상태를 관리합니다.` : '웹사이트 DB에 저장되지 않은 접수입니다. 이 메일을 보관해 주세요.';
}

export function buildEmailHtml(inquiry: NormalizedInquiry, receivedAt: Date, inquiryId?: number) {
  const { data, partnership } = inquiry;
  const kind = partnership ? `파트너 참여 신청 · ${data.help}` : `물류거점 상담 신청 · ${data.tier}등급 ${tiers.find((t) => t.id === data.tier)!.name}`;
  const cell = 'padding:10px 14px;border-bottom:1px solid #E5E7EB;vertical-align:top;font-size:14px;line-height:1.6';
  const rows = emailRows(inquiry, receivedAt)
    .map(
      ([label, value]) =>
        `<tr><th scope="row" style="${cell};width:110px;text-align:left;background:#F4F5F7;color:#6B7280;font-weight:600">${escapeHtml(label)}</th>` +
        `<td style="${cell};color:#111111;white-space:pre-wrap;word-break:break-all">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  return (
    `<!doctype html><html lang="ko"><body style="margin:0;padding:24px;background:#FFFFFF;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111111">` +
    `<p style="margin:0 0 6px;font-size:12px;color:#6B7280">로지루프 · 신규 접수</p>` +
    `<h1 style="margin:0 0 16px;font-size:18px">${escapeHtml(kind)}</h1>` +
    `<table role="presentation" style="border-collapse:collapse;width:100%;max-width:640px;border:1px solid #E5E7EB">${rows}</table>` +
    `<p style="margin:16px 0 0;font-size:12px;color:#6B7280">웹사이트 상담 폼에서 자동 전달된 메일입니다. ${escapeHtml(storageNote(inquiryId))}</p>` +
    `</body></html>`
  );
}

export function buildEmailText(inquiry: NormalizedInquiry, receivedAt: Date, inquiryId?: number) {
  return [...emailRows(inquiry, receivedAt).map(([label, value]) => `${label}: ${value}`), '', storageNote(inquiryId)].join('\n');
}
