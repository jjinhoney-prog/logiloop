export interface OperatingRegion { province: string; district: string }
export function normalizeOperatingRegions(input: unknown): OperatingRegion[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input) || input.length > 10) throw new Error('공개 운영 지역은 최대 10곳입니다.');
  const regions = input.map(value => {
    if (!value || typeof value !== 'object') throw new Error('운영 지역을 확인하세요.');
    const {province, district} = value as Record<string, unknown>;
    if (typeof province !== 'string' || !province.trim() || province.length > 20 || typeof district !== 'string' || !district.trim() || district.length > 60) throw new Error('시·도와 공개 권역을 입력하세요.');
    if (/\d+\s*번지|\d+\s*번길|[가-힣\d]+(?:로|길)\s*\d+/.test(district)) throw new Error('상세 주소 대신 동·권역만 입력하세요.');
    return {province:province.trim(), district:district.trim()};
  });
  return regions.filter((r,i)=>regions.findIndex(x=>x.province===r.province&&x.district===r.district)===i);
}
export function operatingRegionLabel(r: OperatingRegion) {
  return r.district.startsWith(r.province) ? r.district : `${r.province} ${r.district}`;
}
export function matchesOperatingRegion(regions: OperatingRegion[] | undefined, filter: string) {
  return !!regions?.some(r=>r.province===filter || r.district===filter || r.district.startsWith(`${filter}시`) || r.district.startsWith(`${filter}군`) || r.district.startsWith(`${filter}구`));
}
