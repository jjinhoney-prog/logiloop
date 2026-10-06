// supabase/private/zium-import-rows.json을 Supabase listings에 넣는다. 이미 있는 ID는 건너뛴다(덮어쓰지 않음).
// 실행: node --experimental-strip-types scripts/apply-zium-import.mts          (확인만)
//       node --experimental-strip-types scripts/apply-zium-import.mts --apply  (실제 반영)
// 사전 조건: supabase/002_source_url.sql 실행, .env.local에 SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ROOT = new URL('../', import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL('.env.local', ROOT), 'utf8')
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
);
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('.env.local에 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');

const rows = JSON.parse(readFileSync(new URL('supabase/private/zium-import-rows.json', ROOT), 'utf8')) as { id: string; visibility: string }[];
if (rows.some((row) => row.visibility !== 'hidden')) throw new Error('가져오기 매물은 모두 hidden이어야 합니다.');

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: existing, error } = await db.from('listings').select('id').in('id', rows.map((row) => row.id));
if (error) throw new Error(`조회 실패: ${error.message} (002_source_url.sql을 먼저 실행했는지 확인)`);
const skip = new Set((existing as { id: string }[]).map((row) => row.id));
const fresh = rows.filter((row) => !skip.has(row.id));
console.log(`전체 ${rows.length}건 · 이미 있음 ${skip.size}건 · 새로 넣을 ${fresh.length}건`);

if (process.argv.includes('--apply') && fresh.length) {
  const { error: insertError } = await db.from('listings').insert(fresh);
  if (insertError) throw new Error(`반영 실패: ${insertError.message}`);
  console.log(`반영 완료: ${fresh.length}건 (모두 비공개)`);
} else if (fresh.length) {
  console.log('확인만 했습니다. 반영하려면 --apply를 붙여 다시 실행하세요.');
}
