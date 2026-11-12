import { PYEONG_M2, type WarehouseProfile } from './warehouse-profile';

/**
 * 보증금 내부 계산 기준(대표 지시 2026-11-01): 물류센터는 월 임대료(관리비 제외) × 6개월, 공장·창고는 × 10개월.
 * 관리자 검토용 참고값일 뿐 공개 가격에 쓰지 않는다. 등록자가 적은 보증금은 그대로 둔다.
 */
export const depositMonths = (facilityType: string) => facilityType === '물류센터' ? 6 : facilityType === '창고' || facilityType === '공장' ? 10 : undefined;

/** "1억 2,000만원", "1,500만원", "3천원", "15,000,000원" 같은 금액을 원 단위로 바꾼다. 범위·협의는 undefined. */
export function parseKrw(input: string) {
  const s = input.replace(/[\s,]/g, '');
  if (!/\d/.test(s) || /[~∼]|\d-\d/.test(s)) return undefined;
  let won = 0;
  let matched = false;
  const eok = s.match(/(\d+(?:\.\d+)?)억/);
  if (eok) { won += Number(eok[1]) * 1e8; matched = true; }
  const rest = eok ? s.slice(s.indexOf('억') + 1) : s;
  const man = rest.match(/(\d+(?:\.\d+)?)(천)?만/);
  if (man) { won += Number(man[1]) * (man[2] ? 1000 : 1) * 1e4; matched = true; }
  const cheon = rest.match(/(\d+(?:\.\d+)?)천(?!만)/);
  if (cheon) { won += Number(cheon[1]) * 1000; matched = true; }
  if (!matched) {
    const plain = s.match(/^(?:월)?(?:평당)?(\d+(?:\.\d+)?)원?/);
    if (plain) { won = Number(plain[1]); matched = true; }
  }
  return matched && Number.isFinite(won) && won > 0 ? Math.round(won) : undefined;
}

export function formatKrw(won: number) {
  const eok = Math.floor(won / 1e8);
  const man = Math.round((won % 1e8) / 1e4);
  if (eok && man) return `${eok}억 ${man.toLocaleString('ko-KR')}만원`;
  if (eok) return `${eok}억원`;
  if (man) return `${man.toLocaleString('ko-KR')}만원`;
  return `${won.toLocaleString('ko-KR')}원`;
}

/** 월 임대료를 원 단위 월액으로 바꾼다. 평당 단가면 면적(평)을 곱한다. */
export function monthlyRentWon(p: Pick<WarehouseProfile, 'rent' | 'areaValue' | 'areaUnit'>) {
  const unit = parseKrw(p.rent);
  if (unit === undefined) return undefined;
  if (!/평당/.test(p.rent)) return unit;
  const area = Number(p.areaValue.replace(/,/g, ''));
  if (!Number.isFinite(area) || area <= 0) return undefined;
  return Math.round(unit * (p.areaUnit === '㎡' ? area / PYEONG_M2 : area));
}

export interface DepositCheck {
  months?: number; monthlyRent?: number; base?: number; owner?: number;
  /** 'match' 같음 · 'differs' 다름 · 'unknown' 비교 불가 */
  result: 'match' | 'differs' | 'unknown';
  message: string;
}

/** 등록자가 적은 보증금과 내부 계산 기준액을 나란히 비교한다. 어느 값도 덮어쓰지 않는다. */
export function warehouseDepositCheck(p: WarehouseProfile): DepositCheck {
  const months = depositMonths(p.facilityType);
  const monthlyRent = monthlyRentWon(p);
  const owner = p.deposit ? parseKrw(p.deposit) : undefined;
  if (!months || monthlyRent === undefined) {
    return { months, monthlyRent, owner, result: 'unknown', message: !months ? '시설 유형을 확인해야 계산할 수 있습니다.' : p.rent ? `월 임대료(${p.rent})를 금액으로 읽지 못했습니다. 확인 후 직접 계산해 주세요.` : '월 임대료가 없어 계산하지 않았습니다.' };
  }
  const base = monthlyRent * months;
  const formula = `월 ${formatKrw(monthlyRent)} × ${months}개월(${p.facilityType}) = ${formatKrw(base)}`;
  if (!p.deposit) return { months, monthlyRent, base, result: 'unknown', message: `${formula}. 등록자가 보증금을 적지 않았습니다. 임대인 확정 조건을 확인해 주세요.` };
  if (owner === undefined) return { months, monthlyRent, base, result: 'unknown', message: `${formula}. 등록자 입력 보증금(${p.deposit})을 금액으로 읽지 못했습니다.` };
  if (owner === base) return { months, monthlyRent, base, owner, result: 'match', message: `${formula}. 등록자 입력 보증금과 같습니다.` };
  return { months, monthlyRent, base, owner, result: 'differs', message: `${formula}. 등록자 입력 보증금 ${p.deposit}와 다릅니다. 임대인이 따로 확정한 조건이면 그대로 공개하고, 아니면 확인 후 수정해 주세요.` };
}
