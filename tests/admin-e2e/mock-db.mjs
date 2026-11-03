// Isolated in-memory PostgREST substitute. Never connects to Supabase.
import { createServer } from 'node:http';
const port = Number(process.env.MOCK_DB_PORT || 3303);
const base = { type: 'warehouse', visibility: 'published', region: '부산', province: null, district: '테스트 권역', temperature: '상온', area: 990, capacity: '300평', price: '조건 협의', available: '확인 필요', status_note: '테스트', tags: [], height: null, power: null, service: '', suitability: '', limitation: '', checks: [], lat: 35.1, lng: 128.8, sort_order: 1, updated_at: '2026-10-21T00:00:00Z', source_url: null };
let rows;
let inquiries = [];
let quotes = [];
let publications=[], interests=[], agreements=[], reports=[];
let nextInquiryId = 1;
const reset = () => { reports=[];publications=[];interests=[];agreements=[];quotes = []; inquiries = []; nextInquiryId = 1; rows = [
  { ...base, id: 'photo-test', name: '사진 테스트 창고', image_url: `http://127.0.0.1:${port}/photo.svg` },
  { ...base, id: 'linked-test', name: '상담 연결 창고', image_url: null },
  { ...base, id: 'race-test', name: '새 상담 연결 창고', image_url: null },
  { ...base, id: 'broken-test', name: '사진 오류 창고', image_url: `http://127.0.0.1:${port}/missing.jpg` },
]; };
reset();
createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const json = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/reset' && req.method === 'POST') { reset(); return json({ ok: true }); }
  if (url.pathname === '/photo.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#dbe7e9"/><text x="100" y="300" fill="#142b32" font-size="50">TEST LISTING PHOTO</text></svg>'); }
  if (url.pathname === '/missing.jpg') return json({}, 404);
  const extraTables = {request_publications:publications,request_interests:interests,agreements,quote_reports:reports};
  const extra = extraTables[url.pathname.replace('/rest/v1/','')];
  if(extra){
    let body='';if(req.method!=='GET'){for await(const chunk of req)body+=chunk;}const input=body?JSON.parse(body):{};
    if(req.method==='POST'){const key=input.id!==undefined?'id':'group_id';if(extra.some(x=>x[key]===input[key]))return json({code:'23505',message:'duplicate'},409);extra.push({created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...input});return json(null,201);}
    const filters=[...url.searchParams].filter(([key,value])=>!['select','order','limit'].includes(key)&&value.startsWith('eq.'));
    const found=extra.filter(row=>filters.every(([key,value])=>String(row[key])===value.slice(3)));
    if(req.method==='PATCH')found.forEach(row=>Object.assign(row,input));
    return json(req.headers.accept?.includes('vnd.pgrst.object')?found[0]??null:found.slice().reverse());
  }
  if (url.pathname === '/rest/v1/quote_requests') {
    let body = '';
    if (req.method !== 'GET') { for await (const chunk of req) body += chunk; }
    const input = body ? JSON.parse(body) : {};
    if (req.method === 'POST') {
      const incoming = Array.isArray(input) ? input : [input];
      if (incoming.some(v => quotes.some(q => q.group_id === v.group_id && q.partner_id === v.partner_id))) return json({code:'23505',message:'duplicate'},409);
      quotes.push(...incoming.map(v => ({response:null,access_hash:null,expires_at:null,delivery_note:'',sent_at:null,replied_at:null,created_at:new Date().toISOString(),...v})));
      return json(null,201);
    }
    const filters = [...url.searchParams].filter(([key,value])=>!['select','order','limit'].includes(key)&&value.startsWith('eq.'));
    const found = quotes.filter(row=>filters.every(([key,value])=>String(row[key])===value.slice(3)));
    if(req.method==='PATCH') {found.forEach(row=>Object.assign(row,input));return json(found);}
    return json(req.headers.accept?.includes('vnd.pgrst.object') ? found[0] ?? null : found.slice().reverse());
  }
  if (url.pathname === '/rest/v1/inquiries') {
    let body = '';
    if (req.method !== 'GET') { for await (const chunk of req) body += chunk; }
    const patch = body ? JSON.parse(body) : {};
    if (req.method === 'POST') {
      const row = { id: nextInquiryId++, stage: '접수', owner: '', next_action: '', mail_status: 'pending', inquiry_listings: [], ...patch };
      inquiries.push(row); return json(req.headers.accept?.includes('vnd.pgrst.object') ? { id: row.id } : [{ id: row.id }], 201);
    }
    const filters = [...url.searchParams].filter(([key, value]) => !['select', 'order', 'limit'].includes(key) && value.startsWith('eq.'));
    const found = inquiries.filter(row => filters.every(([key, value]) => String(row[key]) === value.slice(3)));
    if (req.method === 'PATCH') { found.forEach(row => Object.assign(row, patch)); return json(found.map(row => ({ id: row.id }))); }
    return json(req.headers.accept?.includes('vnd.pgrst.object') ? found[0] ?? null : found.slice().reverse());
  }
  if (url.pathname === '/rest/v1/inquiry_listings') return json([{ listing_id: 'linked-test' }]);
  if (url.pathname === '/rest/v1/listings') {
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    if (req.method === 'DELETE') {
      if (id === 'linked-test' || id === 'race-test') return json({ code: '23503', message: 'foreign key constraint' }, 409);
      const found = rows.filter(row => row.id === id);
      rows = rows.filter(row => row.id !== id);
      return json(found.map(row => ({ id: row.id })));
    }
    if (req.method === 'POST' || req.method === 'PATCH') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const patch = JSON.parse(body);
      if (req.method === 'POST') {
        if (rows.some(row => row.id === patch.id)) return json({ code: '23505', message: 'duplicate id' }, 409);
        rows.push({ ...base, ...patch });
        return json(null, 201);
      }
      const found = rows.filter(row => row.id === id);
      found.forEach(row => Object.assign(row, patch));
      return json(found.map(row => ({ id: row.id })));
    }
    if (req.method !== 'GET') return json({}, 405);
    const filters = [...url.searchParams].filter(([key, value]) => !['select', 'order', 'limit'].includes(key) && value.startsWith('eq.'));
    const found = rows.filter(row => filters.every(([key, value]) => String(row[key]) === value.slice(3)));
    return json(req.headers.accept?.includes('vnd.pgrst.object') ? found[0] ?? null : found);
  }
  return json({ ok: true });
}).listen(port, '127.0.0.1');
