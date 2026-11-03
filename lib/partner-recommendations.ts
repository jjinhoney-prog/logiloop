import type { InquiryRecord } from './types';
import { partnerProvinces, partnerTemperatures } from './partner-profile';
import { partnerCategories } from './partner-brand';

export interface PartnerRecommendation {
  id: number; company: string; reasons: string[]; checks: string[];
}
/** Internal first-pass shortlist. Registered claims are evidence, never verified capacity. */
export function recommendPartners(inquiry: InquiryRecord | undefined, records: InquiryRecord[]) {
  const candidates: PartnerRecommendation[] = [];
  let excluded = 0;
  if (!inquiry) return { candidates, excluded };
  const region = partnerProvinces.includes(inquiry.region) ? inquiry.region : '';
  const temperature = partnerTemperatures.includes(inquiry.temperature as typeof partnerTemperatures[number]) ? inquiry.temperature : '';
  const category = inquiry.shipperQuote?.category || (partnerCategories.some(c=>c===inquiry.item) ? inquiry.item : '');
  const serviceAliases: Record<string,string> = {'택배':'택배 출고','포장':'포장·임가공'};
  const services = [...new Set((inquiry.shipperQuote?.services ?? []).map(s=>serviceAliases[s]||s))];
  for (const record of records) {
    if (!record.partner) continue;
    const {profile:p,stage} = record.partner;
    if (stage === '보류' || (region && p.regions.length && !p.regions.some(r=>r.province===region)) || (temperature && p.temperatures.length && !p.temperatures.includes(temperature))) { excluded++; continue; }
    const reasons:string[] = [], checks:string[] = [];
    if (region && p.regions.some(r=>r.province===region)) reasons.push(`운영 지역 ${region} 등록`);
    else checks.push('희망 권역 운영 여부 확인 필요');
    if (temperature && p.temperatures.includes(temperature)) reasons.push(`${temperature} 취급 등록`);
    else checks.push('요구 온도대 확인 필요');
    if (category && p.categories?.includes(category)) reasons.push(`${category} 취급 등록`);
    else checks.push(category ? `${category} 취급 경험 확인 필요` : '화주 취급 품목 확인 필요');
    for (const service of services) {
      if (p.services.includes(service)) reasons.push(`${service} 제공 등록`);
      else checks.push(`${service} 제공 여부 확인 필요`);
    }
    if (!services.length) checks.push('필요 작업 범위 확인 필요');
    // Company-wide region and temperature claims do not prove a single matching center.
    checks.push('동일 센터의 지역·온도·작업 충족 여부 확인 필요');
    checks.push(`보관·출고 여유량과 시작일 확인 필요${inquiry.volume ? ` (요청: ${inquiry.volume})` : ''}`);
    if (inquiry.regionDetail) checks.push(`세부 희망 지역: ${inquiry.regionDetail}`);
    if (stage !== '등록 준비 완료') checks.push(`업체 검토 상태: ${stage}`);
    if (!p.quoteEmail) checks.push('견적 수신 이메일 확인 필요');
    if (reasons.length) candidates.push({id:record.id,company:record.company,reasons,checks});
  }
  candidates.sort((a,b)=>b.reasons.length-a.reasons.length || a.checks.length-b.checks.length || a.id-b.id);
  return { candidates:candidates.slice(0,3), excluded };
}
