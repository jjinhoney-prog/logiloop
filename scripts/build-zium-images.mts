// 지음 홈페이지 매물 상세(source_url)의 대표 사진(og:image) 주소를 모아 Supabase 반영용 SQL을 만든다.
// 실행: node --experimental-strip-types scripts/build-zium-images.mts
// 결과: supabase/private/005_zium_image_urls.sql (supabase/004_image_url.sql 실행 후 SQL Editor에서 실행)

import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const IMAGE_PATTERN = /^https:\/\/ziumrealty\.com\/uploads\/item\/\d{1,8}\/[A-Za-z0-9_.-]+$/;

const rows = JSON.parse(readFileSync(new URL('supabase/private/zium-import-rows.json', ROOT), 'utf8')) as { id: string; source_url: string | null }[];

async function ogImage(url: string): Promise<string | undefined> {
  const html = await (await fetch(url)).text();
  const tag = html.match(/<meta[^>]*property="og:image"[^>]*>/)?.[0];
  const content = tag?.match(/content="([^"]+)"/)?.[1];
  return content && IMAGE_PATTERN.test(content) ? content : undefined;
}

const found: [string, string][] = [];
const missing: string[] = [];
for (const row of rows) {
  const image = row.source_url ? await ogImage(row.source_url).catch(() => undefined) : undefined;
  if (image) found.push([row.id, image]);
  else missing.push(row.id);
}

const sql = [
  `-- 지음 홈페이지 대표 사진 ${found.length}건 (${new Date().toISOString().slice(0, 10)} 수집). 사진 없음: ${missing.join(', ') || '없음'}`,
  ...found.map(([id, image]) => `update public.listings set image_url = '${image}' where id = '${id}';`),
  '',
].join('\n');
writeFileSync(new URL('supabase/private/005_zium_image_urls.sql', ROOT), sql);
console.log(`사진 ${found.length}건 · 없음 ${missing.length}건${missing.length ? ` (${missing.join(', ')})` : ''}`);
