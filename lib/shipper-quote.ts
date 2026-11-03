import { partnerCategories } from './partner-brand';
import { validDate, deadlinePassed, type QuoteSpec } from './quotes';
import { costRanges, switchTimings } from './lead';
export const SHIPPER_QUOTE_TITLE = '3PL 견적 요청';
export const SHIPPER_QUOTE_PREFIX = 'LOGILOOP_SHIPPER_QUOTE_V1\n';
export const shipperCategories = [...partnerCategories];
export const shipperServices = ['보관','입출고','포장','택배','B2B 납품','반품'] as const;
export const shipperFields = [
  ['email','견적 회신 이메일','email','quote@example.com',false],
  ['sku','SKU 수','number','취급 상품 종류 수',false],
  ['stock','평균 보관량','number','평균 보관 재고',false],
  ['peakStock','최대 보관량','number','성수기 최대 보관 재고',false],
  ['inbound','월 입고량','number','월 합계 입고량',false],
  ['outbound','월 출고 주문 수','number','월 합계 주문 건수',false],
  ['peakOutbound','일 최대 출고 주문 수','number','피크일 주문 건수',false],
  ['unitsPerOrder','주문당 평균 상품 수','number','예: 1.5',false],
  ['packingCount','월 포장 작업 건수','number','포장 작업이 없으면 0',false],
  ['inboundMethod','입고 형태·빈도','text','팔레트/박스/컨테이너 · 주 몇 회 · 하차 필요 여부',false],
  ['deliveryArea','배송·납품 지역','text','전국 택배 / B2B 납품처 권역·빈도·차량 조건',false],
  ['returnProcess','반품 처리 기준','text','검수·재포장·재입고·폐기 / 없으면 해당 없음',false],
  ['packingMaterial','포장 자재·부자재','text','화주 제공 / 업체 구매 · 완충재·동봉물·라벨 작업',false],
  ['parcelCount','월 택배 박스·봉투 수','number','택배가 없으면 0',false],
  ['returnCount','월 반품 건수','number','반품이 없으면 0',false],
  ['dimensions','대표 포장 규격 (cm)','text','가로×세로×높이 / 여러 규격이면 범위',false],
  ['weight','대표 포장 중량 (kg)','number','박스·봉투 1개 기준',false],
  ['channels','판매·납품 채널','text','자사몰·네이버·쿠팡·제조 거래처 등',false],
  ['startDate','운영 시작 희망일','date','',false],
  ['deadline','견적 회신 희망일','date','',false],
  ['restrictions','상품 취급 주의사항','text','파손·유통기한·로트·위험물 등 / 없으면 없음',false],
  ['cutoff','출고 요일·주문 마감 요구','text','예: 월~금 오후 3시 / 미정이면 협의',false],
  ['materialUrl','상품·포장 참고자료 링크','url','https://',false],
  ['budget','월 예산·현재 비용','text','선택 · 비용 포함 범위도 기재',false],
] as const;
export type ShipperField = typeof shipperFields[number][0];
/** 담당자 전용 리드 정보. 업체용 요청서로 이관하지 않는다. */
export interface ShipperLead {costRange:string;currentCost:string;currentCostVat:string;switchTiming:string;contractEnd:string}
export const emptyLead=():ShipperLead=>({costRange:'',currentCost:'',currentCostVat:'',switchTiming:'',contractEnd:''});
export type ShipperQuote = Record<ShipperField,string> & ShipperLead & {category:string;stockUnit:string;inboundUnit:string;packaging:string;integration:string;services:string[];estimated:boolean;shareConsent:boolean;publicConsent?:boolean};
export const emptyShipperQuote = ():ShipperQuote => ({...(Object.fromEntries(shipperFields.map(([key])=>[key,''])) as Record<ShipperField,string>),...emptyLead(),category:'',stockUnit:'팔레트',inboundUnit:'팔레트',packaging:'',integration:'',services:[],estimated:false,shareConsent:false}) as ShipperQuote;
export const packagingOptions=['원포장 출고','박스 포장','봉투 포장','합포장·세트 구성','별도 협의'];
export const integrationOptions=['엑셀 전달','쇼핑몰 연동','API 연동','별도 협의'];
export const stockUnits=['팔레트','박스','㎡','㎥'];
export const inboundUnits=['팔레트','박스','개'];
export function normalizeShipperQuote(input:unknown, now=Date.now()) {
  const raw=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
  const value=emptyShipperQuote();const errors:Record<string,string>={};
  for(const [key,label,type,,required] of shipperFields){
    const v=raw[key];value[key]=typeof v==='string'?v.trim():'';
    if(required&&!value[key])errors[key]=`${label}을 입력하세요.`;
    if(value[key].length>100)errors[key]='100자 이내로 입력하세요.';
    if(type==='number'&&value[key]&&!/^\d{1,9}(\.\d{1,2})?$/.test(value[key]))errors[key]='0 이상의 숫자를 입력하세요. 소수는 두 자리까지 가능합니다.';
    if(type==='date'&&value[key]&&(!validDate(value[key])||deadlinePassed(value[key],now)))errors[key]='오늘 이후의 유효한 날짜를 선택하세요.';
  }
  if(value.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))errors.email='회신받을 이메일을 확인하세요.';
  for(const key of ['sku','weight','unitsPerOrder'] as const)if(value[key]&&Number(value[key])<=0)errors[key]='0보다 큰 값을 입력하세요.';
  if(value.sku&&!/^\d+$/.test(value.sku))errors.sku='SKU 수는 정수로 입력하세요.';
  if(value.peakStock&&value.stock&&Number(value.peakStock)<Number(value.stock))errors.peakStock='최대 보관량은 평균 보관량 이상이어야 합니다.';
  for(const key of ['category','stockUnit','inboundUnit','packaging','integration'] as const){
    value[key]=typeof raw[key]==='string'?raw[key].trim():'';
    if(value[key].length>100)errors[key]='100자 이내로 입력하세요.';
  }
  if(value.stock&&!value.stockUnit)errors.stockUnit='보관량의 단위를 입력하세요.';
  if(value.inbound&&!value.inboundUnit)errors.inboundUnit='입고량의 단위를 입력하세요.';
  if(raw.services!==undefined && (!Array.isArray(raw.services)||raw.services.length>15||raw.services.some(v=>typeof v!=='string'||!v.trim()||v.length>100)))errors.services='업무는 15개 이내, 각 100자 이내로 입력하세요.';
  else value.services=[...new Set((raw.services as string[]|undefined)??[])];
  if(value.materialUrl){try{const u=new URL(value.materialUrl);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error();}catch{errors.materialUrl='올바른 웹 주소를 입력하세요.';}}
  value.estimated=raw.estimated===true;value.shareConsent=raw.shareConsent===true;value.publicConsent=raw.publicConsent===true;
  const lead=(key:keyof ShipperLead)=>typeof raw[key]==='string'?(raw[key] as string).trim():'';
  value.costRange=lead('costRange');value.switchTiming=lead('switchTiming');value.currentCost=lead('currentCost');value.currentCostVat=lead('currentCostVat');value.contractEnd=lead('contractEnd');
  if(value.costRange&&!(costRanges as readonly string[]).includes(value.costRange))errors.costRange='현재 월 물류비 구간을 선택하세요.';
  if(value.switchTiming&&!(switchTimings as readonly string[]).includes(value.switchTiming))errors.switchTiming='전환 희망 시기를 선택하세요.';
  if(value.currentCost&&!/^\d{1,12}$/.test(value.currentCost))errors.currentCost='월 물류비는 원 단위 숫자로 입력하세요.';
  if(value.currentCostVat&&!['별도','포함'].includes(value.currentCostVat))errors.currentCostVat='부가세 기준을 선택하세요.';
  if(value.currentCost&&!value.currentCostVat)errors.currentCostVat='현재 물류비의 부가세 포함 여부를 선택하세요.';
  if(value.contractEnd&&!validDate(value.contractEnd))errors.contractEnd='유효한 날짜를 입력하세요.';
  if(!value.shareConsent)errors.shareConsent='화주 식별정보를 제외한 견적 조건 전달에 동의해 주세요.';
  return {value,errors};
}
/** 담당자 화면 전용 리드 행. */
export function shipperLeadRows(q:ShipperQuote):[string,string][] {
  return [['현재 월 물류비 구간',q.costRange||'미입력'],['현재 월 물류비',q.currentCost?`${Number(q.currentCost).toLocaleString('ko-KR')}원 (VAT ${q.currentCostVat||'확인 필요'})`:'미입력'],['전환 희망 시기',q.switchTiming||'미입력'],['현 계약 종료일',q.contractEnd||'미입력']];
}
export function shipperQuoteRows(q:ShipperQuote):[string,string][] {
  return [['취급 카테고리',q.category],...shipperFields.map(([key,label])=>[label,q[key]||'협의 필요'] as [string,string]),['보관 단위',q.stockUnit],['입고 단위',q.inboundUnit],['포장 방식',q.packaging],['주문 연동',q.integration],['필요 업무',q.services.join(' · ')||'협의 필요'],['물량 기준',q.estimated?'예상 물량':'현재 운영 물량']];
}
export function encodeShipperQuote(q:ShipperQuote,note:string){return SHIPPER_QUOTE_PREFIX+JSON.stringify({requirements:q,note});}
export function decodeShipperQuote(note:string){
  if(!note.startsWith(SHIPPER_QUOTE_PREFIX))return null;
  try{const v=JSON.parse(note.slice(SHIPPER_QUOTE_PREFIX.length));if(!v.requirements||typeof v.note!=='string'||shipperFields.some(([key])=>typeof v.requirements[key]!=='string')||!['category','stockUnit','inboundUnit','packaging','integration'].every(key=>typeof v.requirements[key]==='string')||!Array.isArray(v.requirements.services)||v.requirements.services.some((x:unknown)=>typeof x!=='string'))return null;return {requirements:{...emptyLead(),...Object.fromEntries(Object.entries(v.requirements).filter(([key,x])=>!(key in emptyLead())||typeof x==='string'))} as ShipperQuote,note:v.note};}catch{return null;}
}
/** Complete business conditions for admin review; dedicated contact fields stay private. */
export function shipperToQuoteSpec(q:ShipperQuote,context:{item:string;region:string;temperature:string},note=''):QuoteSpec {
  const rows=shipperQuoteRows(q).filter(([label])=>label!=='견적 회신 이메일');
  return {...context,start:q.startDate||'협의 필요',deadline:q.deadline,sku:q.sku,peak:`최대 보관 ${q.peakStock||'확인 필요'} ${q.stockUnit} / 일 최대 출고 ${q.peakOutbound||'확인 필요'}건`,
    quantities:[q.stock,q.inbound,q.outbound,q.packingCount,q.parcelCount,q.returnCount],units:[q.stockUnit?`${q.stockUnit}·월`:'단위 확인 필요',q.inboundUnit||'단위 확인 필요','주문건','건','건','건'],
    operations:[...rows.map(([label,value])=>`${label}: ${value||'협의 필요'}`),`화주 추가 요청: ${note||'없음'}`].join('\n')};
}
