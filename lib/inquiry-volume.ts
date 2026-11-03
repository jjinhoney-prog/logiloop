/** 신규 폼은 항목을 분리하고 기존 volume 컬럼에는 단위를 포함해 호환 저장한다. */
export const storageUnits = ['팔레트', '박스', '㎡', '㎥'] as const;
export const outboundUnits = ['주문건', '박스', '팔레트'] as const;
export const quantityLimit = 12;
export interface VolumeFields {
  storageQuantity?: string;
  storageUnit?: string;
  outboundQuantity?: string;
  outboundUnit?: string;
}

export function quantityError(value: unknown): string | undefined {
  if (value === undefined || value === '') return;
  if (typeof value !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(value.trim())) return '0 이상의 숫자를 입력해 주세요. 소수는 두 자리까지 가능합니다.';
}

export function volumeErrors(data: VolumeFields) {
  return {
    ...(quantityError(data.storageQuantity) ? { storageQuantity: quantityError(data.storageQuantity) } : {}),
    ...(quantityError(data.outboundQuantity) ? { outboundQuantity: quantityError(data.outboundQuantity) } : {}),
    ...(data.storageQuantity && !storageUnits.includes(data.storageUnit as typeof storageUnits[number]) ? { storageQuantity: '보관 단위를 선택해 주세요.' } : {}),
    ...(data.outboundQuantity && !outboundUnits.includes(data.outboundUnit as typeof outboundUnits[number]) ? { outboundQuantity: '출고 단위를 선택해 주세요.' } : {}),
  };
}

export function formatInquiryVolume(data: VolumeFields & { volume?: string }): string {
  if (data.storageQuantity === undefined && data.outboundQuantity === undefined) return data.volume?.trim().slice(0, 100) || '아직 모름';
  const storage = data.storageQuantity?.trim();
  const outbound = data.outboundQuantity?.trim();
  return `보관 규모: ${storage ? `${storage} ${data.storageUnit}` : '미정'} / 월 출고량: ${outbound ? `${outbound} ${data.outboundUnit}` : '미정'}`;
}
