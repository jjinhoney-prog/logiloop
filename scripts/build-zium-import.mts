// 지음부동산 매물(Notion '로지루프 창고 소스 DB' 내보내기)을 Supabase 가져오기 SQL로 변환한다.
// 실행: node --experimental-strip-types scripts/build-zium-import.mts
// 입력: supabase/private/zium-listings.json  (git 제외 · 저장소가 공개 상태)
// 출력: supabase/private/003_import_zium_listings.sql (SQL Editor용), zium-import-rows.json (scripts/apply-zium-import.mts용), import-review.md
// 좌표는 카카오 주소 검색으로 구·동(리) 중심점을 구한다. 실제 매물 위치가 아니다.

import { readFileSync, writeFileSync } from 'node:fs';

type Row = [string, string, string, string, string, string, string, string, string, string | null, string | null, string | null, string | null, string, string, string[]];

const ROOT = new URL('../', import.meta.url);
const input = JSON.parse(readFileSync(new URL('supabase/private/zium-listings.json', ROOT), 'utf8')) as { rows: Row[] };

const env = Object.fromEntries(
  readFileSync(new URL('.env.local', ROOT), 'utf8')
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
);
const KAKAO = process.env.KAKAO_REST_KEY || env.KAKAO_REST_KEY;
if (!KAKAO) throw new Error('KAKAO_REST_KEY가 필요합니다.');

const CITY: Record<string, string> = { 부산: '부산광역시', 울산: '울산광역시', 김해: '경상남도 김해시', 양산: '경상남도 양산시', 창원: '경상남도 창원시' };
const PYEONG = 3.305785;
const TODAY = '2026-10-06';

async function geocode(query: string): Promise<[number, number] | null> {
  for (const path of ['address', 'keyword']) {
    const url = `https://dapi.kakao.com/v2/local/search/${path}.json?query=${encodeURIComponent(query)}&size=1`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO}` } });
    if (!res.ok) throw new Error(`kakao ${path} ${res.status}`);
    const doc = ((await res.json()) as { documents: { x: string; y: string }[] }).documents[0];
    if (doc) return [Math.round(Number(doc.y) * 1e4) / 1e4, Math.round(Number(doc.x) * 1e4) / 1e4];
  }
  return null;
}

const num = (s: string) => Number(s.replace(/,/g, ''));

function areaM2(raw: string): number | undefined {
  for (const label of ['전용', '연', '건축']) {
    const m = raw.match(new RegExp(`${label}\\s*([\\d,.]+)㎡`));
    if (m) return Math.round(num(m[1]));
  }
  return undefined;
}

function oneLine(value: string | null, max: number) {
  return value ? value.replace(/\s*\n\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim().slice(0, max) : null;
}

function cleanHeight(value: string | null) {
  if (!value) return null;
  return oneLine(value.replace(/층고\s*:?\s*/g, '').replace(/미$/, 'm').replace(/M$/, 'm'), 20);
}

/** 입주가능일 문구 안의 연·월이 오늘보다 이전이면 재확인 대상 */
function isStale(available: string) {
  const m = available.match(/(20\d{2})[-년\s]*(\d{1,2})/);
  if (!m) return false;
  return `${m[1]}-${m[2].padStart(2, '0')}` < TODAY.slice(0, 7);
}

const q = (v: unknown) => (v === undefined || v === null ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a: string[]) => `array[${a.map(q).join(', ')}]::text[]`;

const cache = new Map<string, [number, number] | null>();
const values: string[] = [];
const objects: Record<string, unknown>[] = [];
const review: string[] = [];

for (const [i, r] of input.rows.entries()) {
  const [id, rawName, sigun, province, dong, use, temperature, areaRaw, priceRaw, height, power, dock, hoist, truck, available, tags] = r;
  const number = id.replace('zium-', '');
  const notes: string[] = [];

  // 매물명 앞의 [내부 메모]는 공개 이름에서 빼고 '확인 사항'으로 옮긴다.
  const memo = rawName.match(/^\[([^\]]+)\]\s*/);
  const name = rawName.replace(/^\[[^\]]+\]\s*/, '').slice(0, 80);
  if (memo) notes.push(memo[1].replace(/-/g, ' · '));

  const area = areaM2(areaRaw);
  const pyeong = rawName.match(/(약\s*)?([\d,]+)평/);
  // 제목의 평수는 연면적인 경우가 있어, 전용면적이 있으면 전용 기준 평수를 쓴다.
  const exclusive = areaRaw.match(/전용\s*([\d,.]+)㎡/);
  const capacity = exclusive
    ? `약 ${Math.round(num(exclusive[1]) / PYEONG).toLocaleString('ko-KR')}평`
    : pyeong
      ? `약 ${pyeong[2]}평`
      : area
        ? `약 ${Math.round(area / PYEONG).toLocaleString('ko-KR')}평`
        : '면적 확인 필요';

  const query = `${CITY[sigun] ?? sigun} ${dong}`;
  if (!cache.has(query)) cache.set(query, await geocode(query));
  const point = cache.get(query);

  if (temperature === '확인 필요') notes.push('온도 조건 확인 필요');
  if (truck === '확인 필요') notes.push('대형차 진입 확인 필요');
  if (truck === '불가') notes.push('대형차 진입 불가');
  if (isStale(available)) notes.push('입주 일정 재확인 필요');
  if (!notes.length) notes.push('세부 조건은 현장 확인 후 안내');

  const coldStorage = use === '저온창고' || tags.includes('냉동') || tags.includes('냉장');
  const suitability = coldStorage
    ? '냉장·냉동 보관 공간이 필요한 식품·유통 화주'
    : area && area >= 3300
      ? '대량 보관·광역 배송 거점이 필요한 화주'
      : area && area >= 1000
        ? '중규모 보관·입출고 공간이 필요한 화주'
        : '소량 보관·작업 공간이 필요한 화주';
  const service = [`${use} 임대`, oneLine(dock, 60), hoist ? `호이스트 ${oneLine(hoist, 40)}` : null].filter(Boolean).join(' · ').slice(0, 200);

  const flags: string[] = [];
  if (!point) flags.push('좌표를 찾지 못해 제외');
  if (memo) flags.push(`매물명 내부 메모 분리: [${memo[1]}]`);
  if (!area) flags.push('면적 원문 없음');
  if (area && pyeong && Math.abs(area / PYEONG - num(pyeong[2])) / num(pyeong[2]) > 0.5) flags.push(`제목 평수(${pyeong[2]}평)는 연면적 · 임대 면적은 ${capacity}`);
  const ratio = areaRaw.match(/전용률\s*(\d+)%/);
  if (ratio && Number(ratio[1]) < 30) flags.push(`전용률 ${ratio[1]}% — 원문 확인`);
  if (isStale(available)) flags.push(`입주가능일 경과: ${available}`);
  if (flags.length) review.push(`| ${id} | ${name.replace(/\|/g, '\\|')} | ${flags.join(' / ')} |`);
  if (!point) continue;

  const row = {
    id,
    type: 'warehouse',
    visibility: 'hidden',
    name,
    region: sigun,
    province: sigun === province ? null : province,
    district: dong,
    temperature,
    area: area ?? null,
    capacity,
    price: oneLine(priceRaw, 60),
    available: oneLine(available, 60),
    status_note: '지음 등록 매물',
    tags: tags.slice(0, 8),
    height: cleanHeight(height),
    power: oneLine(power?.replace(/전력\s*/, '') ?? null, 40),
    service,
    suitability,
    limitation: notes.join(' · ').slice(0, 300),
    checks: ['지음부동산 등록', '서류 확인 대기', '현장 확인 대기', '화주 조건 확인 대기'],
    lat: point[0],
    lng: point[1],
    sort_order: 100 + i,
    source_url: `https://ziumrealty.com/item/view/${number}`,
  };
  objects.push(row);
  values.push(`  (${Object.values(row).map((v) => (Array.isArray(v) ? arr(v) : q(v))).join(', ')})`);
}

writeFileSync(
  new URL('supabase/private/003_import_zium_listings.sql', ROOT),
  `-- 지음부동산 매물 ${values.length}건 가져오기 · 002_source_url.sql 실행 후 실행합니다.
-- 출처: Notion '로지루프 창고 소스 DB' (${TODAY} 기준). 모두 비공개(hidden)로 들어갑니다.
-- 공개는 관리자 화면에서 매물별로 확인한 뒤 전환합니다. 이미 있는 ID는 건너뜁니다.
-- 좌표는 구·동(리) 중심점이며 실제 매물 위치가 아닙니다.

insert into public.listings
  (id, type, visibility, name, region, province, district, temperature, area, capacity, price, available, status_note, tags, height, power, service, suitability, limitation, checks, lat, lng, sort_order, source_url)
values
${values.join(',\n')}
on conflict (id) do nothing;
`,
);

writeFileSync(new URL('supabase/private/zium-import-rows.json', ROOT), JSON.stringify(objects, null, 2));

writeFileSync(
  new URL('supabase/private/import-review.md', ROOT),
  `# 지음 매물 가져오기 검토 목록 (${TODAY})\n\n가져온 매물 ${values.length}건 / 원본 ${input.rows.length}건. 아래 매물은 공개 전 원장 확인이 필요합니다.\n\n| ID | 매물명 | 확인 사항 |\n|---|---|---|\n${review.join('\n')}\n`,
);

console.log(`rows ${input.rows.length} → sql ${values.length}, review ${review.length}, geocode queries ${cache.size}, misses ${[...cache.values()].filter((v) => !v).length}`);
