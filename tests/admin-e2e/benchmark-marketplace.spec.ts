import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const mock=process.env.BENCHMARK_DB_URL||'http://127.0.0.1:3303';
async function login(page:import('@playwright/test').Page){await page.goto('/admin/login');await page.getByLabel('비밀번호').fill('test-only-password');await page.getByRole('button',{name:'로그인',exact:true}).click();await expect(page).toHaveURL('/admin');}
test('approved public summary → interest → withdrawal keeps private source hidden',async({page,request},info)=>{
 test.setTimeout(90000);await request.post(`${mock}/reset`);
 await page.setExtraHTTPHeaders({'x-forwarded-for':info.project.name==='mobile'?'127.0.22.2':'127.0.22.1'});
 await page.goto('/quote/request');
 for(const [k,value]of Object.entries({company:'원본 비공개 화주',name:'비공개 담당자',phone:'01012345678',item:'식품'}))await page.locator(`[name="${k}"]`).fill(value);
 await page.locator('[name="consent"]').check();await page.locator('[name="shipper.shareConsent"]').check();await page.locator('[name="shipper.publicConsent"]').check();
 await page.getByRole('button',{name:'3PL 견적 요청 접수'}).click();await expect(page.getByText('접수번호 #1')).toBeVisible();
 await login(page);await page.goto('/admin/requests');await page.getByLabel('공개 검토를 신청한 화주').selectOption('1');
 for(const [label,value]of [['익명 제목','식품 냉장 보관 검토'],['모집 마감일','2099-01-01'],['공개 설명','냉장 보관과 출고 업무를 검토합니다.']])await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('combobox',{name:'희망 권역',exact:true}).selectOption('경남');await page.getByRole('combobox',{name:'품목군',exact:true}).selectOption('식품');await page.getByRole('combobox',{name:'온도대',exact:true}).selectOption('냉장');await page.getByRole('checkbox',{name:'보관',exact:true}).check();await page.getByRole('checkbox',{name:/화주명·연락처/}).check();await page.getByRole('button',{name:'비공개 초안·화주 승인 링크 만들기'}).click();
 const link=await page.getByLabel('화주 전용 공개 요약 확인 링크 · 직접 전달').inputValue();const [id]=new URL(link).hash.slice(1).split('.');
 await page.goto(`/requests/${id}`);await expect(page.getByRole('heading',{name:'페이지를 찾을 수 없습니다.',exact:true})).toBeVisible();
 await page.goto(link);await expect(page.getByRole('heading',{name:'식품 냉장 보관 검토',exact:true})).toBeVisible();await expect(page.locator('body')).not.toContainText('원본 비공개 화주');
 expect((await request.post('/api/requests/approval',{data:{id,token:'a'.repeat(64),action:'view'}})).status()).toBe(403);
 await page.getByRole('checkbox',{name:/이 요청을 승인할 권한/}).check();await page.getByRole('button',{name:'이 요약 공개 승인'}).click();await expect(page.locator('main').getByRole('status')).toContainText('공개 요약을 승인했습니다');
 await page.goto('/admin/requests');await page.getByRole('button',{name:'승인된 요약 공개'}).click();await expect(page.getByText(/공개 모집 ·/)).toBeVisible();
 await page.goto(`/requests/${id}`);for(const secret of ['원본 비공개 화주','비공개 담당자','01012345678','approval_hash'])expect(await page.content()).not.toContain(secret);
 for(const [label,value]of [['업체명 *','테스트 물류'],['담당자 *','업체 담당자'],['연락처 *','01022223333'],['이메일 *','partner@example.com'],['검토 가능한 센터·권역 *','김해 냉장센터']])await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('checkbox',{name:/검토 의향 접수·연락/}).check();expect((await new AxeBuilder({page}).include('.partner-page').analyze()).violations).toEqual([]);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('request-detail.png'),fullPage:true});await page.getByRole('button',{name:'검토 의향 접수',exact:true}).click();await expect(page.getByRole('heading',{name:'검토 의향을 접수했습니다'})).toBeVisible();
 await page.goto('/admin/requests');await expect(page.getByText('테스트 물류',{exact:true})).toBeVisible();
 await page.goto(link);await page.getByRole('button',{name:'공개 승인 철회'}).click();await expect(page.locator('main').getByRole('status')).toContainText('공개 승인을 철회했습니다');await page.goto(`/requests/${id}`);await expect(page.getByRole('heading',{name:'페이지를 찾을 수 없습니다.',exact:true})).toBeVisible();
});
test('two party signing binds one document, blocks wrong party and retains completed record',async({page,request},info)=>{
 test.setTimeout(90000);await request.post(`${mock}/reset`);await page.setExtraHTTPHeaders({'x-forwarded-for':info.project.name==='mobile'?'127.0.23.2':'127.0.23.1'});await login(page);await page.goto('/admin/agreements');
 await page.getByRole('combobox',{name:'계약 유형',exact:true}).selectOption('물류대행');await page.getByLabel('계약 제목',{exact:true}).fill('테스트 계약 · 실제 계약 아님');
 for(let i=1;i<=2;i++){await page.getByLabel(`당사자 ${i} 법인·상호`).fill(i===1?'가상 화주':'가상 물류사');await page.getByLabel(`당사자 ${i} 서명 권한자 이름`).fill(i===1?'갑테스트':'을테스트');await page.getByLabel(`당사자 ${i} 서명 수신 이메일`).fill(`party${i}@example.com`);}
 await page.getByLabel('검토한 계약 본문',{exact:true}).fill('테스트 전용 문안입니다. 실제 계약·금전 거래는 발생하지 않습니다.');await page.getByRole('checkbox',{name:/문안과 견적/}).check();await page.getByRole('button',{name:'계약 초안 저장'}).click();await expect(page.getByText(/계약 초안을 저장했습니다/)).toBeVisible();
 await page.getByLabel('링크 발급 전 문안 검토·당사자 권한·수신처 확인 기록').fill('격리 테스트용 가상 당사자·실제 전달 없음');await page.getByRole('button',{name:'시연용 자체 서명 링크 발급'}).click();
 const first=await page.getByLabel('당사자 1 전용 서명 링크 · 30일 유효 · 지정 수신자에게만 전달').inputValue();const second=await page.getByLabel('당사자 2 전용 서명 링크 · 30일 유효 · 지정 수신자에게만 전달').inputValue();const [id,index,token]=new URL(first).hash.slice(1).split('.');
 expect((await request.post('/api/agreements/sign',{data:{id,index:1,token,action:'view'}})).status()).toBe(403);
 expect((await request.post('/api/agreements/sign',{data:{id,index:Number(index),token,action:'view'}})).status()).toBe(200);
 for(const [url,name]of [[first,'갑테스트'],[second,'을테스트']]){await page.goto(url);await expect(page.getByRole('heading',{name:'테스트 계약 · 실제 계약 아님',exact:true})).toBeVisible();await page.getByLabel('계약에 기재된 서명자 이름').fill(name);await page.getByRole('checkbox',{name:/위 계약 전체와 당사자/}).check();await page.getByRole('button',{name:'확인한 계약에 서명'}).click();await expect(page.locator('main').getByRole('status')).toContainText(name==='갑테스트'?'상대방 서명 대기':'양 당사자 서명 완료');}
 await expect(page.getByRole('button',{name:'완료 서명 기록 저장'})).toBeVisible();expect((await new AxeBuilder({page}).include('.partner-page').analyze()).violations).toEqual([]);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('signed-agreement.png'),fullPage:true});
 await page.goto('/admin/agreements');await expect(page.getByText(/상태: 양 당사자 서명 완료/)).toBeVisible();await expect(page.getByRole('button',{name:'서명 요청 취소'})).toBeDisabled();
});
test('public supplier conditions survive storage, same-center filters, photos and selected request',async({page,request},info)=>{
 await request.post(`${mock}/reset`);
 const metadata={categories:['식품'],temperatures:['냉장','냉동'],centers:[{province:'경남',district:'김해',temperatures:['냉장'],services:['보관'],total:'100 PLT',spare:'20 PLT',checkedAt:'2026-11-01'},{province:'부산',district:'강서구',temperatures:['냉동'],services:['보관'],total:'50 PLT',spare:'10 PLT',checkedAt:'2026-11-01'}],photos:[{url:`${mock}/photo.svg`,caption:'업체 제공 냉동 작업장',permissionConfirmed:true}]};
 await request.post(`${mock}/rest/v1/listings`,{data:{id:'registered-partner-99',type:'partner',visibility:'published',name:'센터별 조건 테스트',region:'경남',province:'경남',district:'김해',temperature:'복수 온도대',service:'보관',area:null,public_partner:metadata}});
 await page.goto('/partners?region=부산&temperature=냉장');await expect(page.getByRole('link',{name:'센터별 조건 테스트',exact:true})).toHaveCount(0);
 await page.goto('/partners?region=부산&temperature=냉동&category=식품');await expect(page.getByRole('link',{name:'센터별 조건 테스트',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('link',{name:'센터별 조건 테스트',exact:true})).toBeVisible();await page.getByRole('link',{name:'센터별 조건 테스트',exact:true}).click();
 await expect(page.getByRole('img',{name:'업체 제공 냉동 작업장',exact:true})).toBeVisible();await expect(page.getByText('20 PLT',{exact:true})).toBeVisible();await page.screenshot({path:info.outputPath('partner-photos.png'),fullPage:true});
 await page.getByRole('link',{name:'이 업체 문의',exact:true}).click();await expect(page).toHaveURL(/\/quote\/request\?target=registered-partner-99/);await expect(page.getByText(/검토 희망 업체: 센터별 조건 테스트/)).toBeVisible();
});
