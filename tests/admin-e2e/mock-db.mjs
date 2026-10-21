// Isolated in-memory PostgREST substitute. Never connects to Supabase.
import { createServer } from 'node:http';
const port = 3303;
const base = { type: 'warehouse', visibility: 'published', region: '부산', province: null, district: '테스트 권역', temperature: '상온', area: 990, capacity: '300평', price: '조건 협의', available: '확인 필요', status_note: '테스트', tags: [], height: null, power: null, service: '', suitability: '', limitation: '', checks: [], lat: 35.1, lng: 128.8, sort_order: 1, updated_at: '2026-10-21T00:00:00Z', source_url: null };
let rows;
const reset = () => { rows = [
  { ...base, id: 'photo-test', name: '사진 테스트 창고', image_url: `http://127.0.0.1:${port}/photo.svg` },
  { ...base, id: 'linked-test', name: '상담 연결 창고', image_url: null },
  { ...base, id: 'race-test', name: '새 상담 연결 창고', image_url: null },
  { ...base, id: 'broken-test', name: '사진 오류 창고', image_url: `http://127.0.0.1:${port}/missing.jpg` },
]; };
reset();
createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const json = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/reset' && req.method === 'POST') { reset(); return json({ ok: true }); }
  if (url.pathname === '/photo.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#dbe7e9"/><text x="100" y="300" fill="#142b32" font-size="50">TEST LISTING PHOTO</text></svg>'); }
  if (url.pathname === '/missing.jpg') return json({}, 404);
  if (url.pathname === '/rest/v1/inquiries') return json([]);
  if (url.pathname === '/rest/v1/inquiry_listings') return json([{ listing_id: 'linked-test' }]);
  if (url.pathname === '/rest/v1/listings') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (req.method === 'DELETE') {
      if (id === 'linked-test' || id === 'race-test') return json({ code: '23503', message: 'foreign key constraint' }, 409);
      const found = rows.filter(row => row.id === id);
      rows = rows.filter(row => row.id !== id);
      return json(found.map(row => ({ id: row.id })));
    }
    if (req.method !== 'GET') return json({}, 405);
    const found = rows.filter(row => !id || row.id === id);
    return json(req.headers.accept?.includes('vnd.pgrst.object') ? found[0] ?? null : found);
  }
  return json({ ok: true });
}).listen(port, '127.0.0.1');
