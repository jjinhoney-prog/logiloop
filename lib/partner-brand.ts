export const MAX_LOGO_DATA_LENGTH = 48_000;
/** Only small raster images, never SVG/HTML. URLs are rendered by the browser, not fetched by the server. */
export function validPartnerLogo(value: string) {
  if (!value) return true;
  if (value.startsWith('data:')) {
    if (value.length > MAX_LOGO_DATA_LENGTH) return false;
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) return false;
    try { const bytes = atob(match[2]); return match[1] === 'png' ? bytes.startsWith('\x89PNG\r\n\x1a\n') : match[1] === 'jpeg' ? bytes.startsWith('\xff\xd8\xff') : bytes.startsWith('RIFF') && bytes.slice(8,12) === 'WEBP'; } catch { return false; }
  }
  if (value.length > 500) return false;
  try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
export const partnerCategories = ['생활용품','패션·잡화','화장품','식품','건강기능식품','가전·가구','산업재·부품','원부자재','기타'] as const;
export const partnerInfoGroups = [
  {title:'출고·배송 운영', fields:[
    ['operatingDays','출고 운영 요일','예: 월~금 / 토요일 별도 협의'],['cutoff','주문 마감시간','평일·주말 마감을 구분'],['carriers','택배사·운송 방식','이용 택배사 / 화물 / B2B 납품'],['channels','판매·납품 채널','네이버·쿠팡·자사몰·B2B 등'],['overseas','해외 물류 대응','가능 국가·아마존·쇼피 등 실제 대응 범위'],
  ]},
  {title:'시스템·작업 역량', fields:[
    ['wms','WMS·재고 조회','사용 WMS와 화주 재고 조회 방식'],['integrations','주문 연동 방식','API·엑셀·쇼핑몰 연동'],['packing','포장·부가 작업','합포장·세트·라벨·검수·유통가공'],['returns','반품·교환 처리','검수·재포장·폐기 기준'],['restrictions','취급 제한 품목','위험물·파손품·유통기한 등 제한 조건'],
  ]},
  {title:'거래·견적 조건', fields:[
    ['minimumVolume','최소 물량·최소요금 기준','월 출고량 / 최소 보관량 / 월 최소요금'],['responseTime','견적 회신 소요','예: 조건 확인 후 영업일 2일'],['contract','계약·이관 조건','최소 계약기간·해지·재고 이관'],['costNotes','별도 과금 항목','자재·할증·반품·시스템·초기 설정비'],
  ]},
  {title:'확인 자료·운영 실적', fields:[
    ['insurance','보험·배상 기준','가입 범위·한도·유효기간 / 확인 자료 연결'],['certifications','등록·인증 보유 현황','해당되는 등록·인증과 유효기간'],['qualityMetrics','출고 품질 지표','측정 기간·물량·산정 기준과 확인 자료'],
  ]},
] as const;
export type PartnerInfoKey = typeof partnerInfoGroups[number]['fields'][number][0];
