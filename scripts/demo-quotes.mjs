// Local-only interactive demo. No production DB, email, or customer data.
import { spawn } from 'node:child_process';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const env = {...process.env, MOCK_DB_PORT:'3304', SUPABASE_URL:'http://127.0.0.1:3304',SUPABASE_SERVICE_ROLE_KEY:'demo-only-key',ADMIN_PASSWORD:'demo-logiloop',SESSION_SECRET:'demo-session-secret-only-01234567890123456789',RESEND_API_KEY:'',INQUIRY_TO_EMAIL:'',KAKAO_REST_KEY:'',NEXT_PUBLIC_KAKAO_MAP_KEY:'',LOGILOOP_DEMO:'1',NEXT_TELEMETRY_DISABLED:'1'};
const children=[];
function stop(){for(const child of children)child.kill('SIGTERM');}
process.on('SIGINT',()=>{stop();process.exit(0);});process.on('SIGTERM',()=>{stop();process.exit(0);});
const launch=(cmd,args)=>{const p=spawn(cmd,args,{env,stdio:'inherit'});children.push(p);p.on('exit',code=>{if(code){stop();process.exit(code);}});return p;};
async function ready(url){for(let i=0;i<120;i++){try{const r=await fetch(url);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw new Error('시연 서버 시작 실패');}
async function insert(table,data){const r=await fetch(`http://127.0.0.1:3304/rest/v1/${table}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw new Error(`시연 ${table} 저장 실패`);return r.json();}
try{
  launch(process.execPath,['tests/admin-e2e/mock-db.mjs']);await ready('http://127.0.0.1:3304');
  const now=new Date().toISOString();const deadline=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
  await insert('inquiries',{kind:'consultation',tier:1,company:'[시연] 생활용품 화주',name:'시연 담당자',phone:'01000000000',item:'생활용품',region:'부산',region_detail:'부산·김해',temperature:'상온',volume:'보관 100팔레트 / 월 출고 1,000건',timing:'다음 달',note:'시연용 자료',source:'시연',created_at:now,updated_at:now});
  for(const company of ['[시연] 부산 물류 A','[시연] 김해 물류 B']){
    const profile={company,name:'시연 운영팀',phone:'01000000000',quoteEmail:'demo@example.com',quoteContact:'시연 담당자',logoUrl:'',introduction:'가상 업체입니다. 보관·출고 견적 흐름을 확인하는 시연용 자료입니다.',categories:['생활용품'],info:{operatingDays:'월~금',cutoff:'오후 3시',wms:'시연 재고 시스템',minimumVolume:'협의'},regions:[{province:'부산',district:'강서구'}],services:['보관','입출고','택배 출고'],temperatures:['상온'],websiteUrl:'',documentUrl:'https://example.com/demo',disclosure:'업체명·서비스 공개 희망',materials:[],note:'가상 데이터',centers:[{name:'시연센터',address:'부산 강서구 (시연)',temperature:'상온',area:'1,000㎡',height:'8m',dock:'2대',vehicle:'대형차',capacity:'300팔레트',spareCapacity:'100팔레트',availableAt:'다음 달',items:'생활용품',operations:'보관·포장',photoUrl:''}]};
    await insert('inquiries',{kind:'partnership',tier:1,company,name:profile.name,phone:profile.phone,help:'물류사 서비스 소개',region:'부산',region_detail:'강서구',temperature:'상온',item:'',volume:'',timing:'',source:'3PL 간편 등록',note:'LOGILOOP_PARTNER_V1\n'+JSON.stringify({profile,stage:'확인 중',revision:randomUUID(),accessHash:createHash('sha256').update(randomBytes(32)).digest('hex'),expiresAt:Date.now()+30*86400000}),created_at:now,updated_at:now});
  }
  const group=randomUUID();const spec={item:'생활용품',region:'부산·김해',temperature:'상온',start:'다음 달',sku:'50',peak:'성수기 일 150건',operations:'표준 박스 출고 · 가상 조건',deadline,quantities:['100','50','1000','0','0','0'],units:['팔레트·월','팔레트','주문건','건','건','건']};
  const token=randomBytes(32).toString('hex');const pendingId=randomUUID();
  await insert('quote_requests',[{id:randomUUID(),group_id:group,inquiry_id:1,partner_id:2,partner_name:'[시연] 부산 물류 A',spec,state:'회신 완료',revision:randomUUID(),response:{availability:'가능',center:'부산 시연센터',start:'다음 달',rates:['10000','3000','500','','',''],minimum:'2000000',extra:'100000',setup:'300000',vat:'별도',validUntil:deadline,note:'가상 견적 · 실제 거래 불가'},replied_at:now},{id:pendingId,group_id:group,inquiry_id:1,partner_id:3,partner_name:'[시연] 김해 물류 B',spec,state:'전달 완료',revision:randomUUID(),access_hash:createHash('sha256').update(token).digest('hex'),expires_at:Date.now()+14*86400000,sent_at:now,delivery_note:'시연 링크 · 실제 발송 없음'}]);
  launch(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','-p','3204']);await ready('http://127.0.0.1:3204');
  const link=`http://localhost:3204/quote/respond#${pendingId}.${token}`;
  await mkdir('outputs/quote-demo',{recursive:true});
  await writeFile('outputs/quote-demo/시연안내.md',`# 로지루프 시연\n\n- 운영 DB와 분리된 가상 데이터입니다. 재시작하면 초기화됩니다.\n- 관리자: http://localhost:3204/admin/quotes\n- 시연 비밀번호: demo-logiloop\n- 화주 견적 요청: http://localhost:3204/quote/request\n- 업체 등록: http://localhost:3204/partnership\n- 가상 업체 B 회신: ${link}\n- A 업체 견적은 월 2,100,000원, 첫 달 2,400,000원(부가세 별도)입니다. B 회신을 입력한 뒤 관리자 화면을 새로고침해 비교하세요.\n`);
  console.log('\n시연 준비 완료: http://localhost:3204/admin/quotes | 비밀번호 demo-logiloop\n회신 링크: outputs/quote-demo/시연안내.md');
}catch(error){console.error(error.message);stop();process.exit(1);}
