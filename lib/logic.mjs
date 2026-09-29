export function filterListings(items, { query = '', region = '전체 지역', temperature = '전체 온도', type, size = '전체 면적' } = {}) {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter(item => (!type || item.type === type) && (region === '전체 지역' || item.region === region || item.province === region) && (temperature === '전체 온도' || item.temperature === temperature) && (size === '전체 면적' || (size === '1,000㎡ 미만' ? item.area < 1000 : item.area >= 1000)) && `${item.name} ${item.province || ''} ${item.region} ${item.district} ${item.tags.join(' ')} ${item.service}`.toLocaleLowerCase().includes(normalized));
}
export function validateInquiry(data, partnership = false) {
  const errors = {};
  if (!data.name?.trim()) errors.name = '담당자 이름을 입력해 주세요.';
  if (!data.company?.trim()) errors.company = '회사명을 입력해 주세요.';
  if (!/^0[0-9]{8,10}$/.test((data.phone || '').replace(/[\s-]/g, ''))) errors.phone = '연락 가능한 전화번호를 확인해 주세요.';
  if (!partnership && !data.item?.trim()) errors.item = '취급 품목 또는 아직 모름을 입력해 주세요.';
  if (!data.consent) errors.consent = '작성 내용 확인에 동의해 주세요.';
  return errors;
}
export function toggleSelection(current, id, limit = 3) {
  if (current.includes(id)) return current.filter(value => value !== id);
  return current.length >= limit ? current : [...current, id];
}
